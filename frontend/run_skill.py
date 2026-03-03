import sys
import os
import traceback

sys.path.append(r"C:\Users\formation\.agents\skills\ui-ux-pro-max\src\ui-ux-pro-max\scripts")

try:
    from design_system import generate_design_system
    res = generate_design_system("dashboard sports analytics professional", "FPL Dashboard", "markdown", persist=True, output_dir=os.getcwd())
    with open("ux_result.md", "w", encoding="utf-8") as f:
        f.write(res)
    print("Success")
except Exception as e:
    with open("ux_error.txt", "w", encoding="utf-8") as f:
        f.write(traceback.format_exc())
    print("Error")
