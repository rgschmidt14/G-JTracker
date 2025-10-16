from playwright.sync_api import Page, expect

def test_rpg_view(page: Page):
    page.goto("http://localhost:8000")
    page.screenshot(path="jules-scratch/verification/rpg_view.png")
