Feature: Link Management
  As an authenticated user
  I want to manage my links
  So that I can organize my online presence

  Background:
    Given the application is running
    And the database is clean
    And I am authenticated as "test@example.com"

  Scenario: Add a new link
    Given I am on the dashboard
    When I click the "Add Link" button
    And I fill in the link form with:
      | Field       | Value                    |
      | title       | My GitHub Profile        |
      | url         | https://github.com/user  |
      | description | My personal GitHub repo  |
      | icon        | mdi-github               |
    And I submit the form
    Then I should see the new link in my link list
    And the link should be saved in the database

  Scenario: Edit an existing link
    Given I have a link with title "Old Title"
    And I am on the dashboard
    When I click the edit button for "Old Title"
    And I change the title to "New Title"
    And I submit the form
    Then I should see "New Title" in my link list
    And the link should be updated in the database

  Scenario: Delete a link
    Given I have a link with title "Link to Delete"
    And I am on the dashboard
    When I click the delete button for "Link to Delete"
    And I confirm the deletion
    Then the link should be removed from my link list
    And the link should be deleted from the database

  Scenario: Reorder links
    Given I have multiple links in my collection
    And I am on the dashboard
    When I drag and drop to reorder the links
    Then the links should be displayed in the new order
    And the order should be saved in the database

  Scenario: Toggle link visibility
    Given I have a link with title "Hidden Link"
    And I am on the dashboard
    When I toggle the visibility of "Hidden Link"
    Then the link should be marked as inactive
    And the link should not be visible on my public profile

