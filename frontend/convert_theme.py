import re

def update_css():
    with open('src/index.css', 'r') as f:
        content = f.read()

    # Define the new :root variables
    new_root = """:root {
  /* Brand Colors */
  --primary: #1A1A1A;
  --primary-light: #333333;
  --primary-dark: #000000;
  --primary-glow: rgba(0, 0, 0, 0.04);

  --accent: #D2C4A7;
  --accent-light: #E4DAC4;
  --accent-dark: #B3A482;
  --accent-glow: rgba(210, 196, 167, 0.2);

  /* Semantic */
  --success: #2E8B57;
  --success-bg: rgba(46, 139, 87, 0.1);
  --warning: #D97706;
  --warning-bg: rgba(217, 119, 6, 0.1);
  --error: #DC2626;
  --error-bg: rgba(220, 38, 38, 0.1);
  --info: #2563EB;
  --info-bg: rgba(37, 99, 235, 0.1);

  /* Backgrounds — Cream / Light palette */
  --bg-root: #F7F6F2;
  --bg-primary: #FFFFFF;
  --bg-secondary: #FDFDFB;
  --bg-tertiary: #F0EFEA;
  --bg-elevated: #FFFFFF;
  --bg-hover: rgba(0, 0, 0, 0.03);

  /* Glass */
  --glass-bg: rgba(255, 255, 255, 0.85);
  --glass-border: rgba(0, 0, 0, 0.06);
  --glass-blur: 24px;

  /* Text */
  --text-primary: #1C1C1C;
  --text-secondary: #595959;
  --text-tertiary: #8C8C8C;
  --text-inverse: #FFFFFF;

  /* Borders */
  --border-subtle: rgba(0, 0, 0, 0.05);
  --border-default: rgba(0, 0, 0, 0.1);
  --border-strong: rgba(0, 0, 0, 0.15);

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 12px 30px rgba(0, 0, 0, 0.08);
  --shadow-glow: 0 8px 30px rgba(0, 0, 0, 0.04);

  /* Radii */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Transitions */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;

  /* Sidebar */
  --sidebar-width: 260px;
  --sidebar-collapsed: 72px;
  --navbar-height: 64px;
}"""

    # Replace :root section
    content = re.sub(r':root\s*\{[^}]+\}', new_root, content)

    # Make specific style changes
    # Remove gradients from buttons
    content = content.replace("background: linear-gradient(135deg, var(--primary), var(--primary-dark));", "background: var(--primary);")
    content = content.replace("background: linear-gradient(135deg, var(--accent), var(--accent-dark));", "background: var(--accent);")
    
    # Remove box-shadows that look like glow on buttons
    content = content.replace("box-shadow: 0 2px 12px var(--primary-glow);", "box-shadow: var(--shadow-sm);")
    content = content.replace("box-shadow: 0 4px 24px var(--primary-glow);", "box-shadow: var(--shadow-md);")
    content = content.replace("box-shadow: 0 2px 12px var(--accent-glow);", "box-shadow: var(--shadow-sm);")
    content = content.replace("box-shadow: 0 4px 24px var(--accent-glow);", "box-shadow: var(--shadow-md);")

    # Update input background image for select dropdown (make stroke color match text-tertiary in dark mode it was 9B9DB8, let's change to a dark stroke)
    content = content.replace("stroke='%239B9DB8'", "stroke='%238C8C8C'")
    
    # Hero background gradients (remove dark purple/green pulses, make them soft cream/tan)
    content = content.replace("background: radial-gradient(ellipse, var(--primary-glow) 0%, transparent 70%);", "background: radial-gradient(ellipse, rgba(210, 196, 167, 0.15) 0%, transparent 70%);")
    content = content.replace("background: radial-gradient(ellipse, var(--accent-glow) 0%, transparent 70%);", "background: radial-gradient(ellipse, rgba(0, 0, 0, 0.03) 0%, transparent 70%);")
    
    # Landing Nav background
    content = content.replace("background: rgba(11, 13, 23, 0.8);", "background: rgba(255, 255, 255, 0.8);")

    # Remove white color from primary button hovers and links to keep contrast
    content = content.replace("color: white;", "color: var(--text-inverse);")
    
    # But for success/error we might want real white
    content = content.replace("color: var(--text-inverse);", "color: white;")  # Revert
    content = content.replace("color: white;", "color: #FFFFFF;") # Ensure explicit white
    
    with open('src/index.css', 'w') as f:
        f.write(content)

if __name__ == "__main__":
    update_css()
