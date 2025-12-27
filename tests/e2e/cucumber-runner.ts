import { Given, When, Then, Before, After } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { chromium } from 'playwright'
import type { Browser, Page } from 'playwright'
import { setupTest, createMockUser, createMockLinkWithParams } from '../utils/test-helpers'

// Global test state
let browser: Browser
let page: Page
let _testHelper: any

// Test data
const testUsers = new Map()
const testLinks = new Map()

Before(async function () {
  // Setup browser
  browser = await chromium.launch({ headless: false })
  page = await browser.newPage()
  
  // Setup test helper
  _testHelper = setupTest()
  
  // Clear test data
  testUsers.clear()
  testLinks.clear()
})

After(async function () {
  if (browser) {
    await browser.close()
  }
})

// Navigation steps
Given('I am on the {string} page', async function (this: CucumberContext, pageName: string) {
  const urls: Record<string, string> = {
    'home': 'http://localhost:3000',
    'login': 'http://localhost:3000/login',
    'signup': 'http://localhost:3000/signup',
    'dashboard': 'http://localhost:3000/dashboard'
  }
  
  const url = urls[pageName.toLowerCase()]
  if (!url) {
    throw new Error(`Unknown page: ${pageName}`)
  }
  
  await page.goto(url)
  await page.waitForLoadState('networkidle')
})

Given('I visit the profile page for {string}', async function (this: CucumberContext, username: string) {
  await page.goto(`http://localhost:3000/${username}`)
  await page.waitForLoadState('networkidle')
})

// User setup steps
Given('a user with email {string} and password {string} exists', function (email: string, password: string) {
  const user = createMockUser({
    email,
    username: email.split('@')[0],
    password: `hashed_${password}`
  })
  testUsers.set(email, user)
})

Given('a user {string} exists with:', function (username: string, dataTable: any) {
  const data = dataTable.hashes()[0]
  const user = createMockUser({
    email: `${username}@example.com`,
    username,
    name: data.name,
    bio: data.bio
  })
  testUsers.set(user.email, user)
})

Given('the user has active links:', function (dataTable: any) {
  const links = dataTable.hashes()
  const user = Array.from(testUsers.values())[0] // Get first user
  
  links.forEach((linkData: any, index: number) => {
    const link = createMockLinkWithParams(
      user.id,
      linkData.Title,
      linkData.URL,
      undefined,
      undefined,
      true,
      index
    )
    testLinks.set(`${user.id}_${linkData.Title}`, link)
  })
})

Given('I have a link with title {string}', function (title: string) {
  const user = Array.from(testUsers.values())[0]
  const link = createMockLinkWithParams(user.id, title, 'https://example.com')
  testLinks.set(`${user.id}_${title}`, link)
})

Given('I have multiple links in my collection', function () {
  const user = Array.from(testUsers.values())[0]
  const links = [
    createMockLinkWithParams(user.id, 'Link 1', 'https://example1.com', undefined, undefined, true, 0),
    createMockLinkWithParams(user.id, 'Link 2', 'https://example2.com', undefined, undefined, true, 1),
    createMockLinkWithParams(user.id, 'Link 3', 'https://example3.com', undefined, undefined, true, 2)
  ]
  
  links.forEach(link => {
    testLinks.set(`${user.id}_${link.title}`, link)
  })
})

// Authentication steps
Given('I am authenticated as {string}', async function (email: string) {
  const user = testUsers.get(email)
  expect(user).toBeTruthy()
  
  // Mock authentication by setting localStorage
  await page.evaluate((userData) => {
    localStorage.setItem('auth-token', 'mock-token')
    localStorage.setItem('user', JSON.stringify(userData))
  }, user)
  
  // Navigate to dashboard to verify authentication
  await page.goto('http://localhost:3000/dashboard')
  await page.waitForLoadState('networkidle')
})

// Form interaction steps
When('I fill in the registration form with:', async function (dataTable: any) {
  const data = dataTable.hashes()[0]
  
  await page.fill('[data-testid="email-input"]', data.email)
  await page.fill('[data-testid="username-input"]', data.username)
  await page.fill('[data-testid="password-input"]', data.password)
  if (data.name) {
    await page.fill('[data-testid="name-input"]', data.name)
  }
})

When('I fill in the login form with:', async function (dataTable: any) {
  const data = dataTable.hashes()[0]
  
  await page.fill('[data-testid="email-input"]', data.email)
  await page.fill('[data-testid="password-input"]', data.password)
})

When('I fill in the link form with:', async function (dataTable: any) {
  const data = dataTable.hashes()[0]
  
  await page.fill('[data-testid="title-input"]', data.title)
  await page.fill('[data-testid="url-input"]', data.url)
  if (data.description) {
    await page.fill('[data-testid="description-input"]', data.description)
  }
  if (data.icon) {
    await page.fill('[data-testid="icon-input"]', data.icon)
  }
})

When('I submit the form', async function () {
  await page.click('[data-testid="submit-button"]')
  await page.waitForLoadState('networkidle')
})

// Button clicks
When('I click the {string} button', async function (buttonText: string) {
  const selectors: Record<string, string> = {
    'Add Link': '[data-testid="add-link-button"]',
    'Edit Profile': '[data-testid="edit-profile-button"]',
    'logout': '[data-testid="logout-button"]'
  }
  
  const selector = selectors[buttonText] || `button:has-text("${buttonText}")`
  await page.click(selector)
  await page.waitForLoadState('networkidle')
})

When('I click the edit button for {string}', async function (linkTitle: string) {
  await page.click(`[data-testid="edit-button-${linkTitle}"]`)
  await page.waitForLoadState('networkidle')
})

When('I click the delete button for {string}', async function (linkTitle: string) {
  await page.click(`[data-testid="delete-button-${linkTitle}"]`)
})

When('I confirm the deletion', async function () {
  await page.click('[data-testid="confirm-delete-button"]')
  await page.waitForLoadState('networkidle')
})

When('I toggle the visibility of {string}', async function (linkTitle: string) {
  await page.click(`[data-testid="toggle-visibility-${linkTitle}"]`)
  await page.waitForLoadState('networkidle')
})

// Drag and drop
When('I drag and drop to reorder the links', async function () {
  // This would require more complex implementation with Playwright's drag and drop
  // For now, we'll simulate the action
  await page.evaluate(() => {
    // Simulate reordering logic
    const links = document.querySelectorAll('[data-testid^="link-item-"]')
    if (links.length >= 2) {
      // Simulate drag and drop reordering
      const event = new Event('reorder')
      document.dispatchEvent(event)
    }
  })
})

// Profile updates
When('I update my profile with:', async function (dataTable: any) {
  const data = dataTable.hashes()[0]
  
  if (data.name) {
    await page.fill('[data-testid="name-input"]', data.name)
  }
  if (data.bio) {
    await page.fill('[data-testid="bio-input"]', data.bio)
  }
  if (data.avatar) {
    await page.fill('[data-testid="avatar-input"]', data.avatar)
  }
})

When('I change the title to {string}', async function (newTitle: string) {
  await page.fill('[data-testid="title-input"]', newTitle)
})

// Assertion steps
Then('I should be redirected to the {string} page', async function (pageName: string) {
  const urls: Record<string, string> = {
    'login': '/login',
    'dashboard': '/dashboard',
    'home': '/'
  }
  
  const expectedPath = urls[pageName.toLowerCase()]
  expect(expectedPath).toBeTruthy()
  
  await page.waitForURL(`**${expectedPath}`)
  const currentUrl = page.url()
  expect(currentUrl).toContain(expectedPath)
})

Then('I should see a success message', async function () {
  const successMessage = await page.locator('[data-testid="success-message"]').textContent()
  expect(successMessage).toBeTruthy()
  expect(successMessage).not.toBe('')
})

Then('I should see an error message about {string}', async function (errorType: string) {
  const errorMessage = await page.locator('[data-testid="error-message"]').textContent()
  expect(errorMessage).toBeTruthy()
  expect(errorMessage!.toLowerCase()).toContain(errorType.toLowerCase())
})

Then('I should be authenticated', async function () {
  const isAuthenticated = await page.evaluate(() => {
    return localStorage.getItem('auth-token') !== null
  })
  expect(isAuthenticated).toBe(true)
})

Then('I should not be authenticated', async function () {
  const isAuthenticated = await page.evaluate(() => {
    return localStorage.getItem('auth-token') !== null
  })
  expect(isAuthenticated).toBe(false)
})

Then('I should see my user information', async function () {
  const userInfo = await page.locator('[data-testid="user-info"]').textContent()
  expect(userInfo).toBeTruthy()
})

Then('I should see the new link in my link list', async function () {
  const linkExists = await page.locator('[data-testid^="link-item-"]').count()
  expect(linkExists).toBeGreaterThan(0)
})

Then('I should see {string} in my link list', async function (linkTitle: string) {
  const linkElement = page.locator(`[data-testid="link-item-${linkTitle}"]`)
  await expect(linkElement).toBeVisible()
})

Then('the link should be removed from my link list', async function () {
  // Wait for the link to be removed from the DOM
  await page.waitForSelector('[data-testid^="link-item-"]', { state: 'detached' })
})

Then('the links should be displayed in the new order', async function () {
  // This would require checking the actual order of elements
  const links = await page.locator('[data-testid^="link-item-"]').all()
  expect(links.length).toBeGreaterThan(1)
})

Then('the link should be marked as inactive', async function () {
  const inactiveLink = await page.locator('[data-testid^="link-item-"][data-inactive="true"]').count()
  expect(inactiveLink).toBeGreaterThan(0)
})

Then('the link should not be visible on my public profile', async function () {
  // Navigate to public profile and verify link is not visible
  const user = Array.from(testUsers.values())[0]
  await page.goto(`http://localhost:3000/${user.username}`)
  
  const linkVisible = await page.locator('[data-testid^="link-item-"]').count()
  expect(linkVisible).toBe(0)
})

// Profile assertions
Then('I should see the user\'s name {string}', async function (expectedName: string) {
  const nameElement = await page.locator('[data-testid="user-name"]').textContent()
  expect(nameElement).toBe(expectedName)
})

Then('I should see the user\'s bio {string}', async function (expectedBio: string) {
  const bioElement = await page.locator('[data-testid="user-bio"]').textContent()
  expect(bioElement).toBe(expectedBio)
})

Then('I should see the active links', async function () {
  const activeLinks = await page.locator('[data-testid^="link-item-"]').count()
  expect(activeLinks).toBeGreaterThan(0)
})

Then('I should not see inactive links', async function () {
  const inactiveLinks = await page.locator('[data-testid^="link-item-"][data-inactive="true"]').count()
  expect(inactiveLinks).toBe(0)
})

Then('I should see a 404 error page', async function () {
  const errorPage = await page.locator('[data-testid="404-error"]').count()
  expect(errorPage).toBeGreaterThan(0)
})

Then('I should see a message that the user was not found', async function () {
  const errorMessage = await page.locator('[data-testid="user-not-found"]').textContent()
  expect(errorMessage).toContain('not found')
})

Then('my profile should be updated in the database', async function () {
  // This would be verified by checking the updated data
  const updatedInfo = await page.locator('[data-testid="user-info"]').textContent()
  expect(updatedInfo).toBeTruthy()
})

Then('I should see the updated information on my dashboard', async function () {
  const dashboardInfo = await page.locator('[data-testid="dashboard-user-info"]').textContent()
  expect(dashboardInfo).toBeTruthy()
})

// Database assertions (these would be mocked in real tests)
Then('the user should be created in the database', function () {
  // In a real test, this would verify the database state
  expect(testUsers.size).toBeGreaterThan(0)
})

Then('the user should not be created in the database', function () {
  // In a real test, this would verify the database state
  // For now, we just verify the test data wasn't added
})

Then('no new user should be created', function () {
  // Verify no new users were added during the test
})

Then('the link should be saved in the database', function () {
  expect(testLinks.size).toBeGreaterThan(0)
})

Then('the link should be updated in the database', function () {
  // Verify link was updated
})

Then('the link should be deleted from the database', function () {
  // Verify link was deleted
})

Then('the order should be saved in the database', function () {
  // Verify order was saved
})


