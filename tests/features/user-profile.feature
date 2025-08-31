Feature: User Profile
  As a user
  I want to view and manage my profile
  So that others can discover my links

  Background:
    Given the application is running
    And the database is clean

  Scenario: View public profile
    Given a user "testuser" exists with:
      | Field | Value              |
      | name  | Test User          |
      | bio   | Software Developer |
    And the user has active links:
      | Title | URL                    |
      | GitHub| https://github.com/user|
      | Blog  | https://blog.example.com|
    When I visit the profile page for "testuser"
    Then I should see the user's name "Test User"
    And I should see the user's bio "Software Developer"
    And I should see the active links
    And I should not see inactive links

  Scenario: Update profile information
    Given I am authenticated as "test@example.com"
    And I am on the dashboard
    When I click the "Edit Profile" button
    And I update my profile with:
      | Field | Value                |
      | name  | Updated Name         |
      | bio   | Updated Bio          |
      | avatar| https://example.com/avatar.jpg |
    And I submit the form
    Then my profile should be updated in the database
    And I should see the updated information on my dashboard

  Scenario: Profile not found
    When I visit the profile page for "nonexistentuser"
    Then I should see a 404 error page
    And I should see a message that the user was not found

