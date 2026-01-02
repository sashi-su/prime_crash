import asyncio
import pygame
import pygame.locals
import sys
from time import time, sleep

# import game


# settings
pygame.init()
screen = pygame.display.set_mode((1280, 720))
pygame.display.set_caption("prime crash ver.3")

async def main():

    # loading sounds
    pygame.mixer.music.load("sound\\bgm1.ogg")
    confirm_sound = pygame.mixer.Sound("sound\confirm.ogg")
    cancel_sound = pygame.mixer.Sound("sound\cancel.ogg")
    select_sound = pygame.mixer.Sound("sound\select.ogg")
    impossible_sound = pygame.mixer.Sound("sound\impossible.ogg")
    result_sound = pygame.mixer.Sound("sound\\result.ogg")
    pygame.mixer.music.play(-1)

    running = True
    score = 0
    selected_mode = 0
    level_up = 0
    startflag = False
    okflag = False
    initial_level = 1
    screen_type = 1


    black = (0, 0, 0)
    white = (255, 255, 255)
    gray = (224, 224, 224)

    mode_pos = [[(0, 0), (0, 0), (0, 0), (0, 0)],
                [(50, 40),  (50+360, 40),  (50+360, 450),  (50, 450) ],
                [(460, 40), (460+360, 40), (460+360, 450), (460, 450)],
                [(870, 40), (870+360, 40), (870+360, 450), (870, 450)]]
    direction_pos = [(50, 550), (1230, 550), (1230, 700), (50, 700)]
    undo_pos = [(1240, 5), (1275, 5), (1275, 40), (1240, 40)]

    left_triangle_pos = [(410, 270), (410, 360), (340, 315)]
    right_triangle_pos = [(870, 270), (870, 360), (940, 315)]
    start_button_pos = [(440, 450), (840, 450), (840, 530), (440, 530)]
    confirm_button_pos = [(440, 600), (840, 600), (840, 680), (440, 680)]


    # loading the save data
    # スコアの保存機能は後回しにする
    """    try:
            with open("pygame\prime crash ver.3\savedata.txt") as f:
                data = f.read()
            data = eval(data)
        except FileNotFoundError:
            data = {1: {"score": [0, 0, 0, 0, 0], "level": 1},
                    2: {"score": [0, 0, 0, 0, 0], "level": 1},
                    3: {"score": [0, 0, 0, 0, 0], "level": 1}}
            print("The savedata was recreated.")"""
    data = {1: {"score": [0, 0, 0, 0, 0], "level": 1},
            2: {"score": [0, 0, 0, 0, 0], "level": 1},
            3: {"score": [0, 0, 0, 0, 0], "level": 1}}


    # define functions
    def is_in(pos, square_pos):
        (x, y) = pos
        if square_pos[0][0] < x < square_pos[1][0] and square_pos[0][1] < y < square_pos[3][1]:
            return True
        else:
            return False

    def display(screen: pygame.surface.Surface, character: str, font: pygame.font, pos: tuple):
        character = font.render(character, False, black)
        rect = character.get_rect(center=pos)
        screen.blit(character, rect)

    def font(n: int):
        return pygame.font.SysFont(None, n)



    # main
    while running:
        start_time = time()
        screen.fill(white)

        if screen_type == 1:
            # screen to select a mode
            pygame.draw.polygon(screen, gray, mode_pos[selected_mode], 0)
            pygame.draw.polygon(screen, black, mode_pos[1], 5)
            pygame.draw.polygon(screen, black, mode_pos[2], 5)
            pygame.draw.polygon(screen, black, mode_pos[3], 5)

            display(screen, "Complex Mode", font(65), (230, 120))
            display(screen, "Speed Mode", font(65), (640, 120))
            display(screen, "Mixed Mode", font(65), (1050, 120))

            screen.blit(font(40).render("Best Score: ", False, black), (90, 300))
            screen.blit(font(60).render(str(data[1]["score"][0]), False, black), (245, 290))
            screen.blit(font(40).render(" Max Level: ", False, black), (90, 360))
            screen.blit(font(60).render(str(data[1]["level"]), False, black), (245, 350))

            screen.blit(font(40).render("Best Score: ", False, black), (500, 300))
            screen.blit(font(60).render(str(data[2]["score"][0]), False, black), (655, 290))
            screen.blit(font(40).render(" Max Level: ", False, black), (500, 360))
            screen.blit(font(60).render(str(data[2]["level"]), False, black), (655, 350))

            screen.blit(font(40).render("Best Score: ", False, black), (910, 300))
            screen.blit(font(60).render(str(data[3]["score"][0]), False, black), (1065, 290))
            screen.blit(font(40).render(" Max Level: ", False, black), (910, 360))
            screen.blit(font(60).render(str(data[3]["level"]), False, black), (1065, 350))


            direction1 = {0: "Please select the mode you play.",
                        1: "As level increases, flowed numbers become complex.",
                        2: "As level increases, numbers flow faster.",
                        3: "As level increases, both the complexity and speed of flowed numbers change."}[selected_mode]
            direction2 = {0: "",
                        1: "This is for players who are good at calculation.",
                        2: "This is for players who can calculate rapidly.",
                        3: "This mode is the hardest of the three."}[selected_mode]
            direction3 = {0: "",
                        1: "",
                        2: "",
                        3: "I am waiting for skillful and challenging players."}[selected_mode]
            
            screen.blit(font(45).render(direction1, False, black), (60, 570))
            screen.blit(font(45).render(direction2, False, black), (60, 610))
            screen.blit(font(45).render(direction3, False, black), (60, 650))
            pygame.draw.polygon(screen, black, direction_pos, 5)
            display(screen, "X", font(50), (1257, 25))
            pygame.draw.polygon(screen, black, undo_pos, 5)
        

        elif screen_type == 2:
            # screen to select a initial level
            display(screen, "You start with level:", font(60), (640, 80))
            display(screen, str(initial_level), font(360), (640, 305))

            if level_up == -1:
                pygame.draw.polygon(screen, gray, left_triangle_pos, 0)
            elif level_up == 1:
                pygame.draw.polygon(screen, gray, right_triangle_pos, 0)
            pygame.draw.polygon(screen, black, left_triangle_pos, 5)
            pygame.draw.polygon(screen, black, right_triangle_pos, 5)

            if startflag:
                pygame.draw.polygon(screen, gray, start_button_pos, 0)
            pygame.draw.polygon(screen, black, start_button_pos, 5)
            display(screen, "Start", font(80), (640, 490))
            
            direction1 = "Select the initial level."
            direction2 = "If you don't begin with level 1,"
            direction3 = "the score will be saved but the final reached level will NOT."

            screen.blit(font(45).render(direction1, False, black), (60, 570))
            screen.blit(font(45).render(direction2, False, black), (60, 610))
            screen.blit(font(45).render(direction3, False, black), (60, 650))
            pygame.draw.polygon(screen, black, direction_pos, 5)
            display(screen, "X", font(50), (1257, 25))
            pygame.draw.polygon(screen, black, undo_pos, 5)
        

        elif screen_type == 3:
            # screen to show a result
            screen.fill(white)
            display(screen, "Game Over!", font(120), (640, 150))

            if okflag:
                pygame.draw.polygon(screen, gray, confirm_button_pos, 0)
            pygame.draw.polygon(screen, black, confirm_button_pos, 5)
            display(screen, "OK", font(80), (640, 640))

            screen.blit(font(90).render("Score: {0} points".format(score), False, black), (120, 340))
            screen.blit(font(90).render("Level: " + str(level), False, black), (120, 420))

            display(screen, "History: ", font(60), (840, 265))
            newflag = True
            for i in [0, 1, 2, 3, 4]:
                if scores[i] == score and newflag:
                    screen.blit(font(50).render("No.{0}: {1} points  New!".format(i+1, scores[i]), False, black), (830, 300+50*i))
                    newflag = False
                else:
                    screen.blit(font(50).render("No.{0}: {1} points".format(i+1, scores[i]), False, black), (830, 300+50*i))

        pygame.display.update()

        
        for event in pygame.event.get():
            if screen_type == 1:
                # switching the screen
                if event.type == pygame.locals.MOUSEBUTTONUP:
                    if selected_mode:
                        screen_type = 2
                        confirm_sound.play()
                
                # selecting the mode
                elif event.type == pygame.locals.MOUSEMOTION:
                    if is_in(event.pos, mode_pos[1]):
                        selected_mode = 1
                    elif is_in(event.pos, mode_pos[2]):
                        selected_mode = 2
                    elif is_in(event.pos, mode_pos[3]):
                        selected_mode = 3
                    else:
                        selected_mode = 0

                if event.type == pygame.locals.MOUSEBUTTONDOWN and is_in(event.pos, undo_pos):
                    cancel_sound.play()
                    running = False
            

            elif screen_type == 2:
                if event.type == pygame.locals.MOUSEBUTTONUP:
                    # change the level
                    if level_up:
                        if 0 < initial_level + level_up <= data[selected_mode]["level"]:
                            select_sound.play()
                            initial_level += level_up
                        else:
                            impossible_sound.play()

                    # playing a game
                    elif startflag:
                        confirm_sound.play()
                        sleep(0.2)
                        pygame.mixer.music.stop()

                        # ここでゲームを開始する
                        # あとで機能を追加する

                        # (score, level) = game.play_game(screen, selected_mode, initial_level)
                        (score, level) = (0, 1)  # 仮の値
                        result_sound.play()

                        # saving the result
                        scores = data[selected_mode]["score"]
                        scores.append(score)
                        scores = sorted(scores, reverse=True)[:5]
                        data[selected_mode]["score"] = scores
                        if initial_level == 1:
                            data[selected_mode]["level"] = max(data[selected_mode]["level"], level)

                        with open("pygame\prime crash ver.3\savedata.txt", "w") as f:
                            print(data, file=f)
                        print("The result was saved in 'savedata.txt'.")

                        selected_mode = 0
                        initial_level = 1
                        startflag = False
                        screen_type = 3
                        break

                # selecting the level
                elif event.type == pygame.locals.MOUSEMOTION:
                    if is_in(event.pos, [(340, 270), (410, 270), (410, 360), (340, 360)]):
                        level_up = -1
                    elif is_in(event.pos, [(870, 270), (940, 270), (940, 360), (870, 360)]):
                        level_up = 1
                    else:
                        level_up = 0
                    
                    if is_in(event.pos, start_button_pos):
                        startflag = True
                    else:
                        startflag = False
                
                if event.type == pygame.locals.MOUSEBUTTONDOWN and is_in(event.pos, undo_pos):
                    cancel_sound.play()
                    screen_type = 1
                    selected_mode = 0
                    initial_level = 1
            

            elif screen_type == 3:
                # closing a result screen
                if event.type == pygame.locals.MOUSEMOTION:
                    if is_in(event.pos, confirm_button_pos):
                        okflag = True
                    else:
                        okflag = False

                if event.type == pygame.locals.MOUSEBUTTONDOWN and okflag:
                    confirm_sound.play()
                    okflag = False
                    screen_type = 1

                    pygame.mixer.music.play(-1)
            
            
            if event.type == pygame.QUIT:
                print("The game was forced a shutdown.")
                sys.exit()

        while start_time - time() > 1/30:
            pass
        await asyncio.sleep(0)

    print("The game was finished successfully.")

sleep(1)
asyncio.run(main())
