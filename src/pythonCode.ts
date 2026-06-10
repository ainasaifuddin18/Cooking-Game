export const PYTHON_CODE_STRING = `#!/usr/bin/env python3
"""
Python Tkinter Cooking Game
---------------------------
A complete, beginner-friendly, and educational cooking game built with Python and Tkinter.
Designed with Object-Oriented Programming (OOP) concepts, ideal for academic demonstrations 
and student learning.

Features included:
1. Start Menu with instructions & difficulty selection
2. Random Customer Orders with timers
3. Interactive Ingredient Selection System using a modern GUI layout
4. Score, Coin, and 3-Lives Tracking Systems
5. Recipe Unlock Shop with persistent unlocks during session
6. Multi-difficulty support (Easy, Medium, Hard)
7. Local High Score Leaderboard (saved to a JSON file)
"""

import os
import json
import random
import tkinter as tk
from tkinter import messagebox, simpledialog

# --- CONFIGURATION & PALETTE ---
BG_PRIMARY = "#FFFDF6"      # Soft off-white
BG_SECONDARY = "#FEF3C7"    # Soft warm gold
COLOR_DARK = "#27272A"      # Charcoal zinc-800
COLOR_ACCENT = "#F59E0B"    # Amber gold
COLOR_SUCCESS = "#10B981"   # Emerald green
COLOR_DANGER = "#EF4444"    # Rose red
COLOR_INFO = "#3B82F6"      # Blue

FONT_HEADER = ("Helvetica", 18, "bold")
FONT_TITLE = ("Helvetica", 14, "bold")
FONT_BODY = ("Helvetica", 11, "normal")
FONT_MONO = ("Courier New", 11, "bold")

# --- RECIPES DATABASE ---
# Format: Name: { ingredients, emoji, cost_to_unlock, is_initially_unlocked }
RECIPES_DATABASE = {
    "Classic Burger": {
        "ingredients": ["🍔 Bun", "🥩 Patty", "🧀 Cheese", "🥬 Lettuce"],
        "emoji": "🍔",
        "cost": 0,
        "unlocked": True,
        "desc": "A classic stack of bun, beef patty, cheese, and fresh lettuce."
    },
    "Pepperoni Pizza": {
        "ingredients": ["🫓 Dough", "🍅 Sauce", "🧀 Cheese", "🍕 Pepperoni"],
        "emoji": "🍕",
        "cost": 0,
        "unlocked": True,
        "desc": "Fresh dough topped with custom tomato sauce, cheese, and pepperoni."
    },
    "Sushi Roll": {
        "ingredients": ["🍙 Seaweed", "🍚 Rice", "🐟 Salmon", "🥒 Cucumber"],
        "emoji": "🍣",
        "cost": 0,
        "unlocked": True,
        "desc": "Fresh salmon slices and cucumber rolled in premium rice and seaweed."
    },
    "Supreme Taco": {
        "ingredients": ["🌮 Shell", "🥩 Patty", "🥬 Lettuce", "🍅 Tomato"],
        "emoji": "🌮",
        "cost": 30,
        "unlocked": False,
        "desc": "Crispy corn shell packed with savory meat, shredded lettuce, and ripe tomatoes."
    },
    "Cozy Ramen": {
        "ingredients": ["🍜 Noodles", "🍲 Broth", "🥚 Egg", "🍙 Seaweed"],
        "emoji": "🍜",
        "cost": 50,
        "unlocked": False,
        "desc": "Warm, comforting noodle broth topped with seaweed sheet and a soft egg."
    },
    "Pancake Stack": {
        "ingredients": ["🥞 Batter", "🧈 Butter", "🍯 Syrup", "🍓 Strawberry"],
        "emoji": "🥞",
        "cost": 80,
        "unlocked": False,
        "desc": "Fluffy golden cakes topped with fresh strawberries, butter, and rich syrup."
    }
}

# Entire list of possible ingredients
ALL_INGREDIENTS = [
    "🍔 Bun", "🥩 Patty", "🧀 Cheese", "🥬 Lettuce",
    "🫓 Dough", "🍅 Sauce", "🍕 Pepperoni", "🌮 Shell",
    "🍙 Seaweed", "🍚 Rice", "🐟 Salmon", "🥒 Cucumber",
    "🍜 Noodles", "🍲 Broth", "🥚 Egg", "🍅 Tomato",
    "🥞 Batter", "🧈 Butter", "🍯 Syrup", "🍓 Strawberry"
]


class CookingGameApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Chef's Kitchen - Tkinter Cooking Academy")
        self.geometry("820x680")
        self.minsize(800, 640)
        self.configure(bg=BG_PRIMARY)

        # Game State Variables
        self.score = 0
        self.coins = 15  # Starts with some initial coins to spend or save!
        self.lives = 3
        self.difficulty = tk.StringVar(value="Easy")
        self.unlocked_recipes = ["Classic Burger", "Pepperoni Pizza", "Sushi Roll"]
        self.leaderboard_file = "cooking_leaderboard.json"
        
        # Load high scores
        self.leaderboard = self.load_leaderboard()

        # Current level states
        self.current_order = None
        self.current_ingredients = []
        self.timer_seconds = 0
        self.max_timer_seconds = 20
        self.timer_job = None
        self.game_active = False

        # Build Main Frames
        self.container = tk.Frame(self, bg=BG_PRIMARY)
        self.container.pack(fill="both", expand=True, padx=10, pady=10)

        # Register Frames
        self.frames = {}
        for F in (StartMenuFrame, GameFrame, ShopFrame, LeaderboardFrame):
            page_name = F.__name__
            frame = F(parent=self.container, controller=self)
            self.frames[page_name] = frame
            frame.grid(row=0, column=0, sticky="nsew")

        # Set weights and show starter frame
        self.container.grid_rowconfigure(0, weight=1)
        self.container.grid_columnconfigure(0, weight=1)
        self.show_frame("StartMenuFrame")

    def show_frame(self, page_name):
        """Displays the selected frame securely and updates any relevant views."""
        frame = self.frames[page_name]
        frame.tkraise()
        # Refresh widgets if necessary
        if hasattr(frame, "on_show"):
            frame.on_show()

    # --- LEADERBOARD & LOCAL STORAGE ---
    def load_leaderboard(self):
        if os.path.exists(self.leaderboard_file):
            try:
                with open(self.leaderboard_file, "r") as f:
                    return json.load(f)
            except Exception:
                pass
        # Default starting list
        return [
            {"name": "MasterChef Gordon", "score": 250, "difficulty": "Hard"},
            {"name": "Chef Auguste", "score": 180, "difficulty": "Medium"},
            {"name": "Junior Cook Leo", "score": 100, "difficulty": "Easy"},
            {"name": "Student Bobby", "score": 60, "difficulty": "Easy"},
            {"name": "Amateur Pip", "score": 30, "difficulty": "Easy"}
        ]

    def save_leaderboard(self):
        try:
            with open(self.leaderboard_file, "w") as f:
                json.dump(self.leaderboard, f, indent=4)
        except Exception as e:
            messagebox.showerror("Error", f"Could not save leaderboard: {e}")

    def update_leaderboard(self, player_name, score, diff):
        new_entry = {"name": player_name, "score": score, "difficulty": diff}
        self.leaderboard.append(new_entry)
        # Sort desc by score
        self.leaderboard.sort(key=lambda x: x["score"], reverse=True)
        # Keep top 10
        self.leaderboard = self.leaderboard[:10]
        self.save_leaderboard()

    # --- GAMEPLAY LOGIC AND RECURSIVE TIMER ---
    def start_game(self):
        self.score = 0
        self.lives = 3
        # Ensure we always keep unlocked recipes from prior shop purchases
        self.current_ingredients = []
        self.game_active = True
        
        # Configure variables depending on Difficulty
        diff = self.difficulty.get()
        if diff == "Easy":
            self.max_timer_seconds = 25
        elif diff == "Medium":
            self.max_timer_seconds = 18
        else: # Hard
            self.max_timer_seconds = 12

        self.show_frame("GameFrame")
        self.trigger_new_order()

    def stop_timer(self):
        if self.timer_job:
            self.after_cancel(self.timer_job)
            self.timer_job = None

    def trigger_new_order(self):
        """Assembles a new client request randomly and resets state."""
        self.stop_timer()
        if not self.game_active:
            return

        # Pick a random recipe currently unlocked by the chef
        unlocked = [name for name, info in RECIPES_DATABASE.items() if info["unlocked"] or name in self.unlocked_recipes]
        if not unlocked:
            unlocked = ["Classic Burger"]
            
        self.current_order = random.choice(unlocked)
        self.current_ingredients = []
        self.timer_seconds = self.max_timer_seconds
        
        # Update Game UI
        game_frame = self.frames["GameFrame"]
        game_frame.update_order_display()
        game_frame.update_prep_board()
        self.run_timer_tick()

    def run_timer_tick(self):
        """Standard recursive Tkinter after loop to count down."""
        if not self.game_active:
            return

        game_frame = self.frames["GameFrame"]
        game_frame.update_timer(self.timer_seconds, self.max_timer_seconds)

        if self.timer_seconds <= 0:
            # Time's up! Customer walks away frustrated
            self.handle_order_failure(reason="Time expired!")
        else:
            self.timer_seconds -= 1
            self.timer_job = self.after(1000, self.run_timer_tick)

    def select_ingredient(self, ing):
        """Fired when an ingredient button is tapped."""
        if not self.game_active:
            return
        # Cap stack at 6 ingredients max to avoid UI overflow
        if len(self.current_ingredients) < 6:
            self.current_ingredients.append(ing)
            self.frames["GameFrame"].update_prep_board()

    def clear_prep_board(self):
        self.current_ingredients = []
        if self.game_active:
            self.frames["GameFrame"].update_prep_board()

    def serve_dish(self):
        """Verifies if selected ingredients match active order requirements."""
        if not self.game_active or not self.current_order:
            return

        required = RECIPES_DATABASE[self.current_order]["ingredients"]
        
        # Simple set and position comparison
        # Students can learn how to check lists matching in elements
        is_correct = True
        
        # Check lengths
        if len(self.current_ingredients) != len(required):
            is_correct = False
        else:
            # To be lenient, verify element sets match, but also reward exact stacking!
            for ing in required:
                if ing not in self.current_ingredients:
                    is_correct = False
                    break
        
        if is_correct:
            self.handle_order_success()
        else:
            self.handle_order_failure(reason="Wrong ingredients served!")

    def handle_order_success(self):
        # Stop tick
        self.stop_timer()
        
        # Calculate scores and coins
        diff_mult = 1.0
        diff = self.difficulty.get()
        if diff == "Medium":
            diff_mult = 1.5
        elif diff == "Hard":
            diff_mult = 2.0

        points = int(10 * diff_mult)
        # Fast service bonus
        if self.timer_seconds > (self.max_timer_seconds / 2):
            points += 5
            coin_reward = random.randint(5, 8)
        else:
            coin_reward = random.randint(3, 5)

        self.score += points
        self.coins += coin_reward

        messagebox.showinfo(
            "Delicious!", 
            f"Successfully served {self.current_order}! {RECIPES_DATABASE[self.current_order]['emoji']}\\n"
            f"+{points} Points!\\n"
            f"+{coin_reward} Coins! 🪙"
        )
        self.trigger_new_order()

    def handle_order_failure(self, reason):
        self.stop_timer()
        self.lives -= 1
        
        # Flash or alert player
        messagebox.showwarning("Oops!", f"{reason}\\nYou lost 1 Heart! ❤️")

        if self.lives <= 0:
            self.game_over()
        else:
            self.trigger_new_order()

    def game_over(self):
        self.game_active = False
        self.stop_timer()
        
        # Check if score qualifies for leaderboard
        qualified = False
        if len(self.leaderboard) < 5 or self.score > self.leaderboard[-1]["score"]:
            qualified = True

        msg = f"Game Over! Your final score is: {self.score}\\n"
        if qualified:
            msg += "Congratulations! You made a new High Score!"
            
        messagebox.showinfo("Game Over 🍳", msg)

        if qualified:
            player_name = simpledialog.askstring(
                "High Score Leaderboard", 
                "Enter your master chef name:",
                parent=self
            )
            if not player_name or player_name.strip() == "":
                player_name = "Anonymous Cook"
            
            self.update_leaderboard(player_name, self.score, self.difficulty.get())

        self.show_frame("StartMenuFrame")


# --- FRAME CODES FOR VIEWS ---

class StartMenuFrame(tk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent, bg=BG_PRIMARY)
        self.controller = controller

        # Title Block
        header_canvas = tk.Frame(self, bg=BG_SECONDARY, bd=2, relief="groove")
        header_canvas.pack(fill="x", ipady=15, pady=(15, 20))
        
        title_label = tk.Label(
            header_canvas, 
            text="🧑‍🍳 CHEF'S COOKING ACADEMY 🍳", 
            font=FONT_HEADER, 
            fg=COLOR_DARK, 
            bg=BG_SECONDARY
        )
        title_label.pack()
        
        sub_label = tk.Label(
            header_canvas, 
            text="Master your cooking ingredients & fulfill random customer orders!", 
            font=FONT_BODY, 
            fg="#4B5563", 
            bg=BG_SECONDARY
        )
        sub_label.pack(pady=5)

        # Main Layout
        grid_container = tk.Frame(self, bg=BG_PRIMARY)
        grid_container.pack(expand=True, fill="both")
        grid_container.columnconfigure(0, weight=1)
        grid_container.columnconfigure(1, weight=1)

        # -- LEFT PANEL: Game Settings & Controls --
        left_panel = tk.LabelFrame(
            grid_container, 
            text=" Ready to Cook? ", 
            font=FONT_TITLE, 
            fg=COLOR_DARK, 
            bg=BG_PRIMARY, 
            bd=2, 
            relief="groove"
        )
        left_panel.grid(row=0, column=0, padx=15, pady=5, sticky="nsew")

        # Difficulty setting
        diff_label = tk.Label(
            left_panel, 
            text="Select Cooking Pace / Difficulty:", 
            font=FONT_BODY, 
            bg=BG_PRIMARY, 
            fg=COLOR_DARK
        )
        diff_label.pack(pady=(15, 5))

        diff_choices_frame = tk.Frame(left_panel, bg=BG_PRIMARY)
        diff_choices_frame.pack()
        
        for d_key, d_color in [("Easy", COLOR_SUCCESS), ("Medium", COLOR_ACCENT), ("Hard", COLOR_DANGER)]:
            rb = tk.Radiobutton(
                diff_choices_frame, 
                text=f"{d_key} Mode", 
                variable=self.controller.difficulty, 
                value=d_key, 
                font=FONT_BODY,
                bg=BG_PRIMARY,
                fg=COLOR_DARK,
                activebackground=BG_SECONDARY,
                selectcolor="#FFF"
            )
            rb.pack(side="left", padx=10, pady=5)

        # Action Buttons
        play_btn = tk.Button(
            left_panel, 
            text="▶️ Start Cooking Game", 
            command=self.controller.start_game, 
            font=FONT_TITLE, 
            bg=COLOR_SUCCESS, 
            fg="white", 
            activebackground="#059669", 
            activeforeground="white",
            relief="flat", 
            padx=10, 
            pady=10
        )
        play_btn.pack(fill="x", padx=30, pady=20)

        shop_btn = tk.Button(
            left_panel, 
            text="🛒 Unlock Recipes Shop", 
            command=lambda: self.controller.show_frame("ShopFrame"), 
            font=FONT_BODY, 
            bg=COLOR_INFO, 
            fg="white", 
            activebackground="#2563EB", 
            activeforeground="white",
            relief="flat", 
            pady=6
        )
        shop_btn.pack(fill="x", padx=30, pady=(0, 10))

        leader_btn = tk.Button(
            left_panel, 
            text="🏆 High Score Leaderboard", 
            command=lambda: self.controller.show_frame("LeaderboardFrame"), 
            font=FONT_BODY, 
            bg="#8B5CF6", 
            fg="white", 
            activebackground="#7C3AED", 
            activeforeground="white",
            relief="flat", 
            pady=6
        )
        leader_btn.pack(fill="x", padx=30, pady=10)

        # -- RIGHT PANEL: Learn Culinary Guide & Instructions --
        right_panel = tk.LabelFrame(
            grid_container, 
            text=" Kitchen Rules & Instruction ", 
            font=FONT_TITLE, 
            fg=COLOR_DARK, 
            bg=BG_PRIMARY, 
            bd=2, 
            relief="groove"
        )
        right_panel.grid(row=0, column=1, padx=15, pady=5, sticky="nsew")

        rule_text = (
            "📖 HOW TO PLAY:\\n"
            "• Look at the active customer's food request at the top.\\n"
            "• Read the name and recipe requirements.\\n"
            "• Select (click/tap) ingredients from the shelf below to stack onto your serving plate.\\n"
            "• Tap 'Serve!' before the timer runs out!\\n\\n"
            "❤️ LIVES SYSTEM:\\n"
            "• You start with 3 Lives (Hearts).\\n"
            "• Losing time or serving wrong recipe deducts 1 heart.\\n\\n"
            "🪙 WEALTH SHOP:\\n"
            "• Earn coins and points on correct completions.\\n"
            "• Spend coins to unlock Taco, Ramen, and Pancake!\\n\\n"
            "🌟 MULTIPLIERS:\\n"
            "• Medium: 1.5x score, Hard: 2x score!"
        )
        
        info_label = tk.Label(
            right_panel, 
            text=rule_text, 
            font=FONT_BODY, 
            bg=BG_PRIMARY, 
            fg=COLOR_DARK, 
            justify="left", 
            anchor="nw"
        )
        info_label.pack(fill="both", expand=True, padx=15, pady=15)

    def on_show(self):
        # Refresh any display if needed
        pass


class GameFrame(tk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent, bg=BG_PRIMARY)
        self.controller = controller

        # --- HUD PANEL (Top Status bar) ---
        hud_frame = tk.Frame(self, bg=COLOR_DARK, padx=10, pady=8)
        hud_frame.pack(fill="x", pady=(0, 10))

        self.score_label = tk.Label(
            hud_frame, 
            text="Score: 0", 
            font=FONT_TITLE, 
            fg="white", 
            bg=COLOR_DARK
        )
        self.score_label.pack(side="left", padx=10)

        self.coins_label = tk.Label(
            hud_frame, 
            text="Coins: 🪙 0", 
            font=FONT_TITLE, 
            fg=COLOR_ACCENT, 
            bg=COLOR_DARK
        )
        self.coins_label.pack(side="left", padx=20)

        self.lives_label = tk.Label(
            hud_frame, 
            text="Lives: ❤️❤️❤️", 
            font=FONT_TITLE, 
            fg=COLOR_DANGER, 
            bg=COLOR_DARK
        )
        self.lives_label.pack(side="right", padx=10)

        # -- MIDDLE AREA: Customer Order (Left) & Active Prep Board (Right) --
        middle_frame = tk.Frame(self, bg=BG_PRIMARY)
        middle_frame.pack(fill="both", expand=True, pady=10)
        middle_frame.columnconfigure(0, weight=1)
        middle_frame.columnconfigure(1, weight=1)

        # Left Column: Customer Box
        self.customer_frame = tk.LabelFrame(
            middle_frame, 
            text=" Active Customer Request ", 
            font=FONT_TITLE, 
            fg=COLOR_DARK, 
            bg=BG_SECONDARY, 
            bd=2, 
            relief="groove"
        )
        self.customer_frame.grid(row=0, column=0, padx=10, pady=5, sticky="nsew")

        # Cute simulated customer voice element
        self.customer_bubble = tk.Label(
            self.customer_frame, 
            text="Welcome Chef! Setup starting soon...", 
            font=FONT_BODY, 
            bg="white", 
            fg=COLOR_DARK, 
            bd=1, 
            relief="solid", 
            padx=10, 
            pady=10, 
            wraplength=200
        )
        self.customer_bubble.pack(fill="x", padx=15, pady=15)

        self.order_emoji_lbl = tk.Label(
            self.customer_frame, 
            text="🧑‍🍳", 
            font=("Helvetica", 48), 
            bg=BG_SECONDARY
        )
        self.order_emoji_lbl.pack(pady=5)

        self.order_name_lbl = tk.Label(
            self.customer_frame, 
            text="Select Menu to Begin", 
            font=FONT_HEADER, 
            bg=BG_SECONDARY, 
            fg=COLOR_DARK
        )
        self.order_name_lbl.pack()

        # Timer Indicator
        timer_container = tk.Frame(self.customer_frame, bg=BG_SECONDARY)
        timer_container.pack(fill="x", padx=15, pady=15)

        tk.Label(
            timer_container, 
            text="Time Remaining:", 
            font=FONT_BODY, 
            bg=BG_SECONDARY, 
            fg=COLOR_DARK
        ).pack(anchor="w")

        self.timer_canvas = tk.Canvas(
            timer_container, 
            height=18, 
            bg="white", 
            bd=1, 
            highlightthickness=0
        )
        self.timer_canvas.pack(fill="x", pady=2)

        # Right Column: Assembly Prep Board
        prep_frame = tk.LabelFrame(
            middle_frame, 
            text=" Prep Board & Serving Plate ", 
            font=FONT_TITLE, 
            fg=COLOR_DARK, 
            bg=BG_PRIMARY, 
            bd=2, 
            relief="groove"
        )
        prep_frame.grid(row=0, column=1, padx=10, pady=5, sticky="nsew")

        instructions_label = tk.Label(
            prep_frame, 
            text="Ingredients currently stacked on your serving plate:", 
            font=FONT_BODY, 
            bg=BG_PRIMARY, 
            fg="#4B5563"
        )
        instructions_label.pack(pady=(10, 5))

        # Visual plate display listbox
        self.prep_list = tk.Listbox(
            prep_frame, 
            font=FONT_TITLE, 
            bg="white", 
            fg=COLOR_DARK, 
            height=6, 
            bd=1, 
            highlightthickness=0, 
            justify="center"
        )
        self.prep_list.pack(fill="both", expand=True, padx=20, pady=10)

        # Action Buttons for cooking
        actions_sub_frame = tk.Frame(prep_frame, bg=BG_PRIMARY)
        actions_sub_frame.pack(fill="x", pady=(5, 10))

        clear_btn = tk.Button(
            actions_sub_frame, 
            text="🗑️ Empty Plate", 
            command=self.controller.clear_prep_board, 
            font=FONT_BODY, 
            bg=COLOR_DANGER, 
            fg="white", 
            relief="flat", 
            pady=4, 
            width=12
        )
        clear_btn.pack(side="left", padx=20)

        serve_btn = tk.Button(
            actions_sub_frame, 
            text="🍽️ Serve!", 
            command=self.controller.serve_dish, 
            font=FONT_TITLE, 
            bg=COLOR_SUCCESS, 
            fg="white", 
            relief="flat", 
            pady=4, 
            width=12
        )
        serve_btn.pack(side="right", padx=20)

        # -- BOTTOM AREA: Shelf Grid of Ingredients --
        shelf_frame = tk.LabelFrame(
            self, 
            text=" Ingredient Shelf (Click to Add to Plate) ", 
            font=FONT_TITLE, 
            fg=COLOR_DARK, 
            bg=BG_SECONDARY, 
            bd=2, 
            relief="groove"
        )
        shelf_frame.pack(fill="x", pady=10)

        # Render dynamically in grid of 2 rows x 10 columns for compact view
        grid_width = 8
        for idx, ing in enumerate(ALL_INGREDIENTS):
            row = idx // grid_width
            col = idx % grid_width
            
            # Use closure capture for the ingredient string to prevent loop var binding issues
            btn = tk.Button(
                shelf_frame, 
                text=ing, 
                command=lambda val=ing: self.controller.select_ingredient(val), 
                font=FONT_BODY, 
                bg="white", 
                fg=COLOR_DARK, 
                activebackground=BG_SECONDARY,
                relief="raised", 
                borderwidth=2,
                padx=5, 
                pady=5
            )
            btn.grid(row=row, column=col, sticky="nsew", padx=6, pady=6)
            
        for c in range(grid_width):
            shelf_frame.columnconfigure(c, weight=1)

        # Home Menu
        exit_btn = tk.Button(
            self, 
            text="🚪 Back to Main Menu", 
            command=self.handle_quit_confirm, 
            font=FONT_BODY, 
            bg="#6B7280", 
            fg="white", 
            relief="flat"
        )
        exit_btn.pack(anchor="w", pady=(5, 5))

    def on_show(self):
        self.update_order_display()
        self.update_prep_board()

    def update_order_display(self):
        """Redraws score indicators, life counters and user bubble prompts."""
        self.score_label.config(text=f"Score: {self.controller.score}")
        self.coins_label.config(text=f"Coins: 🪙 {self.controller.coins}")
        self.lives_label.config(text=f"Lives: {'❤️' * self.controller.lives}")

        order = self.controller.current_order
        if order:
            recipe = RECIPES_DATABASE[order]
            self.order_emoji_lbl.config(text=recipe["emoji"])
            self.order_name_lbl.config(text=order)
            
            # Format requirements list
            ingredients_desc = ", ".join([ing[2:] for ing in recipe["ingredients"]])
            bubble_text = f"Customer requests: \\n🗺️ {order}\\n🔑 Needs: {ingredients_desc}"
            self.customer_bubble.config(text=bubble_text)
        else:
            self.order_emoji_lbl.config(text="🧑‍🍳")
            self.order_name_lbl.config(text="Cooking Game Starting")
            self.customer_bubble.config(text="Customer is deciding on a menu...")

    def update_prep_board(self):
        """Displays stack of active layers on plate."""
        self.prep_list.delete(0, "end")
        # Reverse stack to visually mimic stacking upward from cooking plate!
        for ing in reversed(self.controller.current_ingredients):
            self.prep_list.insert("end", ing)

    def update_timer(self, seconds_left, max_seconds):
        percent = max(0.0, min(1.0, seconds_left / max_seconds))
        # Clear previous canvas drawings
        self.timer_canvas.delete("all")
        
        # Draw nice rounded-looking bar
        w = self.timer_canvas.winfo_width()
        if w < 10:  # Fail-safe during initial load / mapping process
            w = 200
            
        colors = COLOR_SUCCESS if percent > 0.5 else (COLOR_ACCENT if percent > 0.25 else COLOR_DANGER)
        # Draw filled progress bar
        self.timer_canvas.create_rectangle(0, 0, w * percent, 18, fill=colors, outline="")
        # Overlay remaining seconds text
        self.timer_canvas.create_text(
            w / 2, 9, 
            text=f"{seconds_left}s", 
            font=FONT_MONO, 
            fill="black" if percent > 0.3 else "red"
        )

    def handle_quit_confirm(self):
        if messagebox.askyesno("Exit Game", "Are you sure you want to stop cooking and return to Main Menu?"):
            self.controller.game_active = False
            self.controller.stop_timer()
            self.controller.show_frame("StartMenuFrame")


class ShopFrame(tk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent, bg=BG_PRIMARY)
        self.controller = controller

        header = tk.Frame(self, bg=BG_SECONDARY, bd=2, relief="groove")
        header.pack(fill="x", ipady=10, pady=(10, 15))
        
        tk.Label(
            header, 
            text="🛒 CULINARY RECIPE SHOP 🛒", 
            font=FONT_HEADER, 
            fg=COLOR_DARK, 
            bg=BG_SECONDARY
        ).pack()
        
        self.shop_coins_lbl = tk.Label(
            header, 
            text="Your Wallet: 🪙 15 Coins", 
            font=FONT_TITLE, 
            fg=COLOR_ACCENT, 
            bg=BG_SECONDARY
        )
        self.shop_coins_lbl.pack()

        # Shelf grid wrapper
        self.grid_container = tk.Frame(self, bg=BG_PRIMARY)
        self.grid_container.pack(fill="both", expand=True, padx=15, pady=5)
        
        self.grid_container.columnconfigure(0, weight=1)
        self.grid_container.columnconfigure(1, weight=1)

        # Back button
        back_btn = tk.Button(
            self, 
            text="⬅️ Back to Main Menu", 
            command=lambda: self.controller.show_frame("StartMenuFrame"), 
            font=FONT_BODY, 
            bg="#6B7280", 
            fg="white", 
            relief="flat", 
            padx=10, 
            pady=6
        )
        back_btn.pack(pady=15)

    def on_show(self):
        self.shop_coins_lbl.config(text=f"Your Balance: 🪙 {self.controller.coins} Coins")
        self.render_recipes_grid()

    def render_recipes_grid(self):
        # Clean current children in container
        for child in self.grid_container.winfo_children():
            child.destroy()

        # Display recipes
        for idx, (name, details) in enumerate(RECIPES_DATABASE.items()):
            row = idx // 2
            col = idx % 2

            frame = tk.LabelFrame(
                self.grid_container, 
                text=f" {details['emoji']} {name} ", 
                font=FONT_TITLE, 
                fg=COLOR_DARK, 
                bg=BG_PRIMARY, 
                bd=2, 
                relief="groove"
            )
            frame.grid(row=row, column=col, padx=15, pady=10, sticky="nsew")

            # Check unlock status in database
            is_unlocked = details["unlocked"] or name in self.controller.unlocked_recipes

            # List requirements
            ing_names = ", ".join([ing[2:] for ing in details["ingredients"]])
            lbl_ingredients = tk.Label(
                frame, 
                text=f"Ingredients needed:\\n👉 {ing_names}", 
                font=FONT_BODY, 
                bg=BG_PRIMARY, 
                fg="#374151", 
                justify="left",
                wraplength=300
            )
            lbl_ingredients.pack(anchor="w", padx=10, pady=5)

            # Details description
            lbl_desc = tk.Label(
                frame, 
                text=f"\\"{details['desc']}\\"", 
                font=("Helvetica", 9, "italic"), 
                bg=BG_PRIMARY, 
                fg="#6B7280",
                justify="left"
            )
            lbl_desc.pack(anchor="w", padx=10, pady=2)

            if is_unlocked:
                status_lbl = tk.Label(
                    frame, 
                    text="✅ UNLOCKED & ACTIVE", 
                    font=("Helvetica", 11, "bold"), 
                    fg=COLOR_SUCCESS, 
                    bg=BG_PRIMARY
                )
                status_lbl.pack(pady=10)
            else:
                purchase_btn = tk.Button(
                    frame, 
                    text=f"🪙 Buy / Unlock Recipe ({details['cost']} Coins)", 
                    command=lambda r_name=name, r_cost=details["cost"]: self.buy_recipe(r_name, r_cost), 
                    font=FONT_BODY, 
                    bg=COLOR_ACCENT, 
                    fg="white", 
                    activebackground="#D97706", 
                    activeforeground="white",
                    relief="flat"
                )
                purchase_btn.pack(pady=10)

    def buy_recipe(self, name, cost):
        """Unlocks locked recipe as selectable options in future orders."""
        if self.controller.coins >= cost:
            self.controller.coins -= cost
            # Add to list
            self.controller.unlocked_recipes.append(name)
            # Update database in memory
            RECIPES_DATABASE[name]["unlocked"] = True
            
            messagebox.showinfo(
                "Recipe Unlocked!", 
                f"Congratulations! You can now serve {name}! {RECIPES_DATABASE[name]['emoji']}\\n"
                "Customers will start requesting it randomly in your games!"
            )
            self.on_show()
        else:
            messagebox.showerror(
                "Insufficient Funds", 
                f"You do not have enough coins!\\n"
                f"You need {cost} coins, but you only have {self.controller.coins} coins.\\n"
                f"Serve more delicious dishes to earn coins! 🪙"
            )


class LeaderboardFrame(tk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent, bg=BG_PRIMARY)
        self.controller = controller

        header = tk.Frame(self, bg=BG_SECONDARY, bd=2, relief="groove")
        header.pack(fill="x", ipady=10, pady=(10, 15))
        
        tk.Label(
            header, 
            text="🏆 KITCHEN HIGH SCORES LEADERBOARD 🏆", 
            font=FONT_HEADER, 
            fg=COLOR_DARK, 
            bg=BG_SECONDARY
        ).pack()

        # Table panel
        self.table_frame = tk.Frame(self, bg="white", bd=1, relief="solid")
        self.table_frame.pack(expand=True, fill="both", padx=50, pady=10)

        # Bottom clear and back
        controls_frame = tk.Frame(self, bg=BG_PRIMARY)
        controls_frame.pack(pady=15)

        reset_btn = tk.Button(
            controls_frame, 
            text="🧹 Clear Records", 
            command=self.reset_leaderboard, 
            font=FONT_BODY, 
            bg=COLOR_DANGER, 
            fg="white", 
            relief="flat", 
            padx=10, 
            pady=5
        )
        reset_btn.pack(side="left", padx=15)

        back_btn = tk.Button(
            controls_frame, 
            text="⬅️ Back to Main Menu", 
            command=lambda: self.controller.show_frame("StartMenuFrame"), 
            font=FONT_BODY, 
            bg="#6B7280", 
            fg="white", 
            relief="flat", 
            padx=10, 
            pady=5
        )
        back_btn.pack(side="right", padx=15)

    def on_show(self):
        self.render_leaderboard_list()

    def render_leaderboard_list(self):
        # Clear prior records
        for child in self.table_frame.winfo_children():
            child.destroy()

        # Render Table Headers
        headers = ["Rank", "Chef Name", "Score", "Difficulty"]
        widths = [8, 25, 12, 12]
        
        for col_idx, (header_text, w) in enumerate(zip(headers, widths)):
            lbl = tk.Label(
                self.table_frame, 
                text=header_text, 
                font=FONT_TITLE, 
                bg=COLOR_DARK, 
                fg="white", 
                width=w, 
                pady=6
            )
            lbl.grid(row=0, column=col_idx, sticky="nsew")

        # Load scores
        scores = self.controller.leaderboard
        
        for idx, entry in enumerate(scores):
            bg = "#F9FAFB" if idx % 2 == 0 else "white"
            
            # Highlight first place
            fg_score = COLOR_ACCENT if idx == 0 else COLOR_DARK
            rank_text = f"🥇 1st" if idx == 0 else (f"🥈 2nd" if idx == 1 else (f"🥉 3rd" if idx == 2 else f"  {idx+1}th"))
            
            vals = [rank_text, entry["name"], f"{entry['score']} pts", entry["difficulty"]]
            
            for col_idx, val in enumerate(vals):
                lbl = tk.Label(
                    self.table_frame, 
                    text=val, 
                    font=FONT_BODY, 
                    bg=bg, 
                    fg=fg_score if col_idx == 2 else COLOR_DARK, 
                    pady=6, 
                    anchor="center"
                )
                lbl.grid(row=idx+1, column=col_idx, sticky="nsew")

        # Configure columns stretch
        for c in range(4):
            self.table_frame.columnconfigure(c, weight=1)

    def reset_leaderboard(self):
        if messagebox.askyesno("Reset Leaderboard", "Are you sure you want to permanently delete all kitchen records?"):
            self.controller.leaderboard = []
            self.controller.save_leaderboard()
            self.on_show()


# --- BOOTSTRAP MAIN LOOP ---
if __name__ == "__main__":
    app = CookingGameApp()
    app.mainloop()
`;
