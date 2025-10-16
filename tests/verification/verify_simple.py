from playwright.sync_api import Page, expect
import os
import traceback

def test_simple_screenshot(page: Page):
    """
    This test verifies that Playwright can take a screenshot of a simple HTML file.
    """
    try:
        print("Starting simple screenshot test...")
        # 1. Arrange: Go to the test.html file.
        page.goto(f"file://{os.path.abspath('test.html')}")
        print("Navigated to test.html")

        # 2. Screenshot: Capture the final result for visual verification.
        screenshot_path = "test_screenshot.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        if os.path.exists(screenshot_path):
            print("Screenshot file exists.")
        else:
            print("Screenshot file does not exist.")

    except Exception as e:
        print(f"An error occurred: {e}")
        traceback.print_exc()
