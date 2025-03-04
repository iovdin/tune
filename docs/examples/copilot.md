---
title: Developer copilot 
parent: Examples
layout: home
permalink: /examples/copilot
nav_order: 4
---
## Copilot
Lets make a tetris game. 
The system prompt is pretty simple.
```chat
system: 
@sonnet @writefile @readfile @shell @patch
user: 
can you make a tetris game?
assistant: 
I'd be happy to help you create a Tetris game! I can write a simple Tetris implementation in Python using the Pygame library, which is great for 2D games like this.

Let's start by creating a Tetris game with the basic features:
- Falling tetromino pieces
- Piece rotation
- Line clearing
- Game over detection
- Score tracking

First, let's make sure Pygame is installed and then create the game:
tool_call: shell
pip install pygame
tool_result: Collecting pygame
  Downloading pygame-2.6.1-cp313-cp313-macosx_10_13_x86_64.whl.metadata (12 kB)
Downloading pygame-2.6.1-cp313-cp313-macosx_10_13_x86_64.whl (13.1 MB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 13.1/13.1 MB 20.9 MB/s eta 0:00:00
Installing collected packages: pygame
Successfully installed pygame-2.6.1
assistant: 
Now, let's write the Tetris game code. I'll create a complete implementation:
tool_call: writefile {"filename":"tetris.py"}
import pygame
import random
import time

# Initialize pygame
pygame.init()

### CUT THE CODE FOR BREVITY
### CUT THE CODE FOR BREVITY

if __name__ == "__main__":
    main()
tool_result: written
assistant: 
Now let's run the Tetris game:
tool_call: shell
python tetris.py
tool_result: pygame 2.6.1 (SDL 2.28.4, Python 3.13.1)
Hello from the pygame community. https://www.pygame.org/contribute.html
user: 
can you make background white?
assistant: 
I'll modify the Tetris game to have a white background instead of black. Let's update the code:
tool_call: readfile {"filename":"tetris.py"}
tool_result: @tetris.py
assistant: 
Now I'll update the code to make the background white. I'll need to modify the screen.fill() call and adjust the side panel and text colors to maintain proper visibility:
tool_call: patch {"filename":"tetris.py"}
<<<<<<< ORIGINAL
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
=======
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
LIGHT_GRAY = (220, 220, 220)
DARK_GRAY = (80, 80, 80)
>>>>>>> UPDATED

<<<<<<< ORIGINAL
            # Draw side panel background
            pygame.draw.rect(
                screen,
                BLACK,
                (GRID_WIDTH * CELL_SIZE, 0, 8 * CELL_SIZE, SCREEN_HEIGHT)
            )
            
            # Draw next piece preview
            font = pygame.font.SysFont(None, 36)
            next_text = font.render("Next:", True, WHITE)
            screen.blit(next_text, (GRID_WIDTH * CELL_SIZE + 20, 20))
=======
            # Draw side panel background
            pygame.draw.rect(
                screen,
                DARK_GRAY,
                (GRID_WIDTH * CELL_SIZE, 0, 8 * CELL_SIZE, SCREEN_HEIGHT)
            )
            
            # Draw next piece preview
            font = pygame.font.SysFont(None, 36)
            next_text = font.render("Next:", True, WHITE)
            screen.blit(next_text, (GRID_WIDTH * CELL_SIZE + 20, 20))
>>>>>>> UPDATED

<<<<<<< ORIGINAL
        # Update display
        screen.fill(BLACK)
        game.draw()
        pygame.display.flip()
=======
        # Update display
        screen.fill(WHITE)
        game.draw()
        pygame.display.flip()
>>>>>>> UPDATED

<<<<<<< ORIGINAL
                    WHITE if self.grid[row][col] == 0 else self.grid[row][col],
                    (col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE),
                    0 if self.grid[row][col] != 0 else 1
=======
                    WHITE if self.grid[row][col] == 0 else self.grid[row][col],
                    (col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE),
                    0 if self.grid[row][col] != 0 else 1  # Draw cell border for empty cells
>>>>>>> UPDATED
tool_result: patched
assistant: 
Let's fix a few more things to ensure the code is clean and working properly:
tool_call: patch {"filename":"tetris.py"}
<<<<<<< ORIGINAL
        # Draw the grid background
        for row in range(GRID_HEIGHT):
            for col in range(GRID_WIDTH):
                pygame.draw.rect(
                    screen, 
                                        WHITE if self.grid[row][col] == 0 else self.grid[row][col],
                    (col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE),
                    0 if self.grid[row][col] != 0 else 1  # Draw cell border for empty cells

                )
=======
        # Draw the grid background
        for row in range(GRID_HEIGHT):
            for col in range(GRID_WIDTH):
                pygame.draw.rect(
                    screen, 
                    WHITE if self.grid[row][col] == 0 else self.grid[row][col],
                    (col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE),
                    0 if self.grid[row][col] != 0 else 1  # Draw cell border for empty cells
                )
>>>>>>> UPDATED

<<<<<<< ORIGINAL
        
                    # Draw side panel background
            pygame.draw.rect(
                screen,
                DARK_GRAY,
                (GRID_WIDTH * CELL_SIZE, 0, 8 * CELL_SIZE, SCREEN_HEIGHT)
            )
            
            # Draw next piece preview
            font = pygame.font.SysFont(None, 36)
            next_text = font.render("Next:", True, WHITE)
            screen.blit(next_text, (GRID_WIDTH * CELL_SIZE + 20, 20))

=======
        # Draw side panel background
        pygame.draw.rect(
            screen,
            DARK_GRAY,
            (GRID_WIDTH * CELL_SIZE, 0, 8 * CELL_SIZE, SCREEN_HEIGHT)
        )
        
        # Draw next piece preview
        font = pygame.font.SysFont(None, 36)
        next_text = font.render("Next:", True, WHITE)
        screen.blit(next_text, (GRID_WIDTH * CELL_SIZE + 20, 20))
>>>>>>> UPDATED
tool_result: patched
```

Not that `readfile` does not output whole file, but uses `@` to include the file contents. To be less verbose and more readable





