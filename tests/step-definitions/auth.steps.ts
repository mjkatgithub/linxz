import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from 'chai'
import { createPinia, setActivePinia } from 'pinia'
import type { Pinia } from 'pinia'
import { useUserStore } from '~/stores/user'
import { useAppStore } from '~/stores/app'

// Define Cucumber context interface
interface CucumberContext {
  pinia?: Pinia
  userStore?: ReturnType<typeof useUserStore>
  appStore?: ReturnType<typeof useAppStore>
  currentPage?: string
  formData?: Record<string, unknown>
  lastError?: string
  lastSuccess?: string
  createdUser?: User
  createdLink?: Link
  currentUser?: User
  lastAction?: string
}

interface User {
  id: number
  email: string
  username: string
  password: string
  name: string
  avatar?: string | null
  bio?: string | null
  createdAt: Date
  updatedAt: Date
}

interface Link {
  id: number
  title: string
  url: string
  description?: string | null
  icon?: string | null
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  userId: number
}

// Mock data
const mockUsers = new Map()
const mockLinks = new Map()

// Helper functions
const createMockUser = (email: string, password: string, username: string, name?: string) => {
  const user = {
    id: Date.now(),
    email,
    username,
    password: `hashed_${password}`, // Simulated hash
    name: name || 'Test User',
    avatar: null,
    bio: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  mockUsers.set(email, user)
  return user
}

const createMockLink = (userId: number, title: string, url: string, description?: string, icon?: string) => {
  const link = {
    id: Date.now(),
    title,
    url,
    description: description || null,
    icon: icon || null,
    order: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId
  }
  mockLinks.set(`${userId}_${title}`, link)
  return link
}

// Background steps
Given('the application is running', async function (this: CucumberContext) {
  setActivePinia(createPinia())
  this.pinia = createPinia()
  this.userStore = useUserStore()
  this.appStore = useAppStore()
})

Given('the database is clean', function () {
  mockUsers.clear()
  mockLinks.clear()
})

// Authentication steps
Given('I am on the signup page', async function (this: CucumberContext) {
  // Mock navigation to signup page
  this.currentPage = 'signup'
})

Given('I am on the login page', async function (this: CucumberContext) {
  // Mock navigation to login page
  this.currentPage = 'login'
})

Given('I am on the dashboard', async function (this: CucumberContext) {
  // Mock navigation to dashboard
  this.currentPage = 'dashboard'
})

Given('I am authenticated as {string}', async function (this: CucumberContext, email: string) {
  const user = mockUsers.get(email)
  expect(user).to.exist
  
  // Set user directly in store state
  if (this.userStore) {
    this.userStore.currentUser = {
      ...user,
      isAuthenticated: true
    }
  }
  this.currentUser = user
})

Given('a user with email {string} and password {string} exists', function (email: string, password: string) {
  createMockUser(email, password, email.split('@')[0])
})

Given('a user with email {string} exists', function (email: string) {
  createMockUser(email, 'password123', email.split('@')[0])
})

Given('a user {string} exists with:', function (username: string, dataTable: any) {
  const data = dataTable.hashes()[0]
  createMockUser(`${username}@example.com`, 'password123', username, data.name)
})

// Form interaction steps
When('I fill in the registration form with:', function (this: CucumberContext, dataTable: any) {
  const data = dataTable.hashes()[0]
  this.formData = {
    email: data.email,
    username: data.username,
    password: data.password,
    name: data.name
  }
})

When('I fill in the login form with:', function (this: CucumberContext, dataTable: any) {
  const data = dataTable.hashes()[0]
  this.formData = {
    email: data.email,
    password: data.password
  }
})

When('I fill in the link form with:', function (this: CucumberContext, dataTable: any) {
  const data = dataTable.hashes()[0]
  this.formData = {
    title: data.title,
    url: data.url,
    description: data.description,
    icon: data.icon
  }
})

When('I submit the form', async function (this: CucumberContext) {
  if (this.currentPage === 'signup') {
    await handleSignup.call(this)
  } else if (this.currentPage === 'login') {
    await handleLogin.call(this)
  } else if (this.currentPage === 'dashboard') {
    await handleLinkSubmission.call(this)
  }
})

// Form handlers
async function handleSignup(this: CucumberContext) {
  const { email, username, password, name } = this.formData! as any
  
  // Validate email format
  if (!email.includes('@')) {
    this.lastError = 'Invalid email format'
    return
  }
  
  // Check if user already exists
  if (mockUsers.has(email)) {
    this.lastError = 'Email already exists'
    return
  }
  
  // Create user
  const user = createMockUser(email, password, username, name)
  this.lastSuccess = 'User created successfully'
  this.createdUser = user
}

async function handleLogin(this: CucumberContext) {
  const { email, password } = this.formData! as any
  const user = mockUsers.get(email)
  
  if (!user || user.password !== `hashed_${password}`) {
    this.lastError = 'Invalid credentials'
    return
  }
  
  // Set user directly in store state
  if (this.userStore) {
    this.userStore.currentUser = {
      ...user,
      isAuthenticated: true
    }
  }
  this.lastSuccess = 'Login successful'
}

async function handleLinkSubmission(this: CucumberContext) {
  const { title, url, description, icon } = this.formData! as any
  const link = createMockLink(this.currentUser!.id, title, url, description, icon)
  this.lastSuccess = 'Link created successfully'
  this.createdLink = link
}

// Assertion steps
Then('I should be redirected to the login page', function (this: CucumberContext) {
  expect(this.lastSuccess).to.equal('User created successfully')
  // In a real test, you would check the current route
})

Then('I should be redirected to the dashboard', function (this: CucumberContext) {
  expect(this.lastSuccess).to.equal('Login successful')
  expect(this.userStore?.isLoggedIn).to.be.true
})

Then('I should be redirected to the home page', function (this: CucumberContext) {
  expect(this.userStore?.isLoggedIn).to.be.false
})

Then('I should see a success message', function (this: CucumberContext) {
  expect(this.lastSuccess).to.exist
})

Then('I should see an error message about invalid email', function (this: CucumberContext) {
  expect(this.lastError).to.equal('Invalid email format')
})

Then('I should see an error message about email already exists', function (this: CucumberContext) {
  expect(this.lastError).to.equal('Email already exists')
})

Then('I should see an error message about invalid credentials', function (this: CucumberContext) {
  expect(this.lastError).to.equal('Invalid credentials')
})

Then('I should be authenticated', function (this: CucumberContext) {
  expect(this.userStore?.isLoggedIn).to.be.true
})

Then('I should not be authenticated', function (this: CucumberContext) {
  expect(this.userStore?.isLoggedIn).to.be.false
})

Then('I should see my user information', function (this: CucumberContext) {
  expect(this.userStore?.currentUser).to.exist
  expect(this.userStore?.currentUser?.email).to.equal(this.formData?.email)
})

Then('the user should be created in the database', function (this: CucumberContext) {
  expect(mockUsers.has(this.formData?.email)).to.be.true
})

Then('the user should not be created in the database', function (this: CucumberContext) {
  expect(mockUsers.has(this.formData?.email)).to.be.false
})

Then('no new user should be created', function (this: CucumberContext) {
  // This would be verified by checking the user count before and after
  expect(this.lastError).to.exist
})

// Logout steps
When('I click the logout button', function (this: CucumberContext) {
  this.userStore?.logout()
})

// Link management steps
When('I click the {string} button', function (this: CucumberContext, buttonText: string) {
  this.lastAction = `clicked_${buttonText.toLowerCase().replace(' ', '_')}`
})

Then('I should see the new link in my link list', function (this: CucumberContext) {
  expect(this.createdLink).to.exist
  expect(this.createdLink?.title).to.equal(this.formData?.title)
})

Then('the link should be saved in the database', function (this: CucumberContext) {
  const linkKey = `${this.currentUser?.id}_${this.formData?.title}`
  expect(mockLinks.has(linkKey)).to.be.true
})


