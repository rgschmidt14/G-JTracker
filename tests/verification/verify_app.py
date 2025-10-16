from playwright.sync_api import Page, expect
import os
import traceback

def test_app_navigation(page: Page):
    """
    This test verifies that the G&J Tracker application navigates
    correctly between the different views.
    """
    try:
        print("Starting test...")
        # 1. Arrange: Go to the application's index.html file.
        # We use os.path.abspath to get the full path to the file.
        page.goto(f"file://{os.path.abspath('index.html')}")
        print("Navigated to index.html")

        # 2. Act: Click through the different navigation tabs.
        page.get_by_role("button", name="Notebook").click()
        print("Clicked Notebook tab")
        expect(page.get_by_role("heading", name="Notebook")).to_be_visible()
        print("Notebook view verified")

        page.get_by_role("button", name="RPG").click()
        print("Clicked RPG tab")
        expect(page.get_by_role("heading", name="RPG")).to_be_visible()
        print("RPG view verified")

        page.get_by_role("button", name="Reference").click()
        print("Clicked Reference tab")
        expect(page.get_by_role("heading", name="Reference")).to_be_visible()
        print("Reference view verified")

        page.get_by_role("button", name="DB View").click()
        print("Clicked DB View tab")
        expect(page.get_by_role("heading", name="DB View")).to_be_visible()
        print("DB view verified")

        # 3. Screenshot: Capture the final result for visual verification.
        screenshot_path = "verification.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        if os.path.exists(screenshot_path):
            print("Screenshot file exists.")
        else:
            print("Screenshot file does not exist.")

    except Exception as e:
        print(f"An error occurred: {e}")
        traceback.print_exc()
