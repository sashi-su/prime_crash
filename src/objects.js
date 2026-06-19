export const PRIMES = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61,
  67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137,
  139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211,
  223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283,
  293, 307, 311, 313,
];

let currentLane1 = 2;
let currentLane2 = 4;

export function resetLaneMemory() {
  currentLane1 = 2;
  currentLane2 = 4;
}

export function primeFactorize(value) {
  let n = value;
  const factors = [];

  for (const p of PRIMES) {
    let exponent = 0;
    while (n % p === 0) {
      exponent += 1;
      n /= p;
    }
    if (exponent > 0) {
      factors.push([p, exponent]);
    }
    if (n === 1) {
      break;
    }
  }

  return factors;
}

export class Circle {
  constructor(number, lane, speed) {
    this.number = number;
    this.lane = lane;
    this.place = 30;
    this.baseSpeed = speed;
    this.speed = speed;
    this.burst = false;
    this.clear = false;
    this.grothendieck = false;
  }

  move(dt, layout) {
    this.place += this.speed * 30 * dt * layout.speedScale;
    if (this.place > layout.gameArea.width - layout.circleRadius) {
      this.burst = true;
    }
  }
}

export function factorizationMessage(number) {
  const factors = primeFactorize(number);

  if (factors.length === 1 && factors[0][1] === 1) {
    return `${number} is a prime number.`;
  }

  const expression = factors.map(([factor, exponent]) => {
    return exponent === 1 ? `${factor}` : `${factor}${toSuperscript(exponent)}`;
  });
  return `${number} = ${expression.join(" × ")}`;
}

function toSuperscript(value) {
  const digits = {
    0: "⁰",
    1: "¹",
    2: "²",
    3: "³",
    4: "⁴",
    5: "⁵",
    6: "⁶",
    7: "⁷",
    8: "⁸",
    9: "⁹",
  };
  return String(value).replace(/[0-9]/g, (digit) => digits[digit]);
}

export class Square {
  constructor(number, lane, startPlace) {
    this.number = number;
    this.lane = lane;
    this.place = startPlace;
  }

  move(dt, layout) {
    this.place -= 20 * 30 * dt * layout.speedScale;
  }
}

export class ScoreFloat {
  constructor(point, x, y) {
    this.number = point;
    this.x = x;
    this.y = y;
    this.life = 1;
  }

  move(dt) {
    this.life -= dt;
    this.y -= 20 * dt;
  }

  get display() {
    return this.life > 0;
  }
}

export function pointForCombo(combo) {
  if (combo === 1 || combo === 2) {
    return 50;
  } else if (combo === 3 || combo === 4) {
    return 60;
  } else if (combo === 5 || combo === 6) {
    return 70;
  } else if (combo === 7 || combo === 8) {
    return 80;
  } else if (combo === 9 || combo === 10) {
    return 90;
  } else if (combo >= 11) {
    return 100;
  }
}

export function divide(circle, square) {
  if (square.number === 1) {
    if (circle.number === 57) {
      circle.grothendieck = true;
      return "";
    }
    if (PRIMES.includes(circle.number)) {
      circle.clear = true;
      return "";
    }
    circle.burst = true;
  } else if (circle.number % square.number === 0) {
    circle.number /= square.number;
    if (circle.number === 1) {
      circle.clear = true;
    }
    return "";
  }

  circle.burst = true;
  return factorizationMessage(circle.number);
}

export function createCircle(mode, level, numbers) {
  const lanes = [1, 2, 3, 4].filter((lane) => {
    return lane !== currentLane1 && lane !== currentLane2;
  });
  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  currentLane2 = currentLane1;
  currentLane1 = lane;

  if (mode === 1) {
    const levelNumbers = numbers[level - 1];
    const number = levelNumbers[Math.floor(Math.random() * levelNumbers.length)];
    // Setting of speeds for each level
    const speeds = {
      1: 1.5,
      2: 1.5,
      3: 1.5,
      4: 1.5,
      5: 1.5,
      6: 1.4,
      7: 1.3,
      8: 1.2,
      9: 1.1,
      10: 1,
    };
    return new Circle(number, lane, speeds[level]);
  }

  let speedNumbers;
  if (level === 1) {
    speedNumbers = numbers[0];
  }
  else if (level === 2) {
    speedNumbers = [...numbers[0], ...numbers[0], ...numbers[0], ...numbers[1]];
  }
  else if (level === 3) {
    speedNumbers = [...numbers[0], ...numbers[0], ...numbers[1]];
  }
  else  {
    speedNumbers = [...numbers[0], ...numbers[1], 57];
  }
  const number = speedNumbers[Math.floor(Math.random() * speedNumbers.length)];
  const speeds = {
    1: 1.50,
    2: 2.00,
    3: 2.50,
    4: 3.00,
    5: 3.32,
    6: 3.71,
    7: 4.20,
    8: 4.85,
    9: 5.73,
    10: 7.00,
  };
  return new Circle(number, lane, speeds[level]);
}

export function grothendieckCircles(circle) {
  const factors = primeFactorize(circle.number);
  const circles = [];
  let offset = 0;

  for (const [factor, exponent] of factors) {
    for (let i = 0; i < exponent; i += 1) {
      const newCircle = new Circle(factor, circle.lane, 0);
      newCircle.place = circle.place + offset * 110;
      circles.push(newCircle);
      offset += 1;
    }
  }

  return circles;
}
