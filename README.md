# Sentinow Blueprint JIRA Forge App

This project contains a JIRA Forge app for Sentinow Blueprint that integrates test management functionality with JIRA issues through custom fields and panels.

## Features

- **Custom Fields**: Display test case count, test review status, and release signal for JIRA issues
- **Issue Panel**: Show test cases associated with specific JIRA issues
- **Global Page**: Dashboard view of all test cases and statistics
- **Supabase Integration**: Real-time data fetching from Supabase backend

## Requirements

See [Set up Forge](https://developer.atlassian.com/platform/forge/set-up-forge/) for instructions to get set up.

## Quick start

- Install dependencies
```
npm install
```

- Build and deploy your app by running:
```
forge deploy
```

- Install your app in an Atlassian site by running:
```
forge install
```

- Develop your app by running `forge tunnel` to proxy invocations locally:
```
forge tunnel
```

## Custom Fields

The app provides three custom fields for JIRA issues:

1. **Blueprint Test Cases**: Shows the count of test cases linked to the issue
2. **Blueprint Test Review**: Displays the review status (OPEN, IN REVIEW, APPROVED, REJECTED)
3. **Blueprint Release Signal**: Shows release readiness (Review, Not Ready, Ready to Ship)

## Error Resolution

If you see "The app's value function returned an unexpected response" errors:

1. Check that all custom field functions return arrays for multiple issues
2. Ensure Supabase queries use correct syntax (select=id instead of select=count for counting)
3. Verify error handling returns appropriate default values
4. Check console logs for detailed error information

## Architecture

- **Frontend**: React components using @forge/react
- **Backend**: Forge resolvers with Supabase integration
- **Database**: Supabase PostgreSQL with real-time capabilities
- **Custom Fields**: Computed values from test case data

### Notes
- Use the `forge deploy` command when you want to persist code changes.
- Use the `forge install` command when you want to install the app on a new site.
- Once the app is installed on a site, the site picks up the new app changes you deploy without needing to rerun the install command.