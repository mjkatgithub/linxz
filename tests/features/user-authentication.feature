Feature: User Authentication
  As a user
  I want to be able to register, login and logout
  So that I can access my personal link collection

  Background:
    Given the application is running
    And the database is clean

  Scenario: User registration with valid data
    Given I am on the signup page
    When I fill in the registration form with:
      | Field    | Value              |
      | email    | test@example.com   |
      | username | testuser           |
      | password | password123        |
      | name     | Test User          |
    And I submit the form
    Then I should be redirected to the login page
    And I should see a success message
    And the user should be created in the database

  Scenario: User registration with invalid email
    Given I am on the signup page
    When I fill in the registration form with:
      | Field    | Value              |
      | email    | invalid-email      |
      | username | testuser           |
      | password | password123        |
      | name     | Test User          |
    And I submit the form
    Then I should see an error message about invalid email
    And the user should not be created in the database

  Scenario: User registration with existing email
    Given a user with email "existing@example.com" exists
    And I am on the signup page
    When I fill in the registration form with:
      | Field    | Value                |
      | email    | existing@example.com |
      | username | newuser              |
      | password | password123          |
      | name     | New User             |
    And I submit the form
    Then I should see an error message about email already exists
    And no new user should be created

  Scenario: User login with valid credentials
    Given a user with email "test@example.com" and password "password123" exists
    And I am on the login page
    When I fill in the login form with:
      | Field    | Value              |
      | email    | test@example.com   |
      | password | password123        |
    And I submit the form
    Then I should be redirected to the dashboard
    And I should be authenticated
    And I should see my user information

  Scenario: User login with invalid credentials
    Given a user with email "test@example.com" and password "password123" exists
    And I am on the login page
    When I fill in the login form with:
      | Field    | Value              |
      | email    | test@example.com   |
      | password | wrongpassword      |
    And I submit the form
    Then I should see an error message about invalid credentials
    And I should not be authenticated

  Scenario: User logout
    Given I am authenticated as "test@example.com"
    And I am on the dashboard
    When I click the logout button
    Then I should be redirected to the home page
    And I should not be authenticated

