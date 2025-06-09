export { handler } from './resolvers';
import { fetch } from '@forge/api';

// Supabase configuration
const SUPABASE_URL = 'https://lypmvowiceznyqopnpro.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cG12b3dpY2V6bnlxb3BucHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNDQxNzYsImV4cCI6MjA2MjYyMDE3Nn0.aJxWzb9khwZQnkPgypFaxpERf3clG0NKLYNta2zEaTo';

// Helper function to make Supabase API calls
async function supabaseQuery(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers
    };

    try {
        console.log(`Making Supabase request to: ${url}`);
        const response = await fetch(url, {
            method: options.method || 'GET',
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Supabase API error: ${response.status} - ${errorText}`);
            throw new Error(`Supabase API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`Supabase response:`, data);
        return data;
    } catch (error) {
        console.error('Error making Supabase request:', error);
        throw error;
    }
}

export const computeTestCasesCount = async (payload) => {
    console.log('computeTestCasesCount called with:', payload);

    try {
        // Check if we have the expected payload structure
        if (!payload || !payload.issues || !Array.isArray(payload.issues)) {
            console.log('Invalid payload, returning default value [0]');
            return [0];
        }

        const issues = payload.issues;
        console.log('Processing issues for test cases count:', issues.length);

        // Process each issue to get test cases count
        const results = await Promise.all(issues.map(async (issue) => {
            try {
                // Extract JIRA issue key from the issue object
                const issueKey = issue.key || issue.id;
                if (!issueKey) {
                    console.log('No issue key found, returning 0');
                    return 0;
                }

                console.log(`Fetching test cases count for issue: ${issueKey}`);

                // Query Supabase for test cases linked to this JIRA issue
                // Use select=id to count records instead of select=count
                const testCases = await supabaseQuery(
                    `test_cases?select=id&jira_id=eq.${issueKey}`
                );

                const count = Array.isArray(testCases) ? testCases.length : 0;
                console.log(`Found ${count} test cases for issue ${issueKey}`);
                return count;
            } catch (error) {
                console.error(`Error fetching test cases for issue:`, error);
                return 0; // Return 0 in case of error for this specific issue
            }
        }));

        console.log('Returning array of values:', results);
        return results;
    } catch (error) {
        console.error('Error in computeTestCasesCount:', error);
        return [0]; // Return array with 0 in case of error
    }
};

export const computeTestReviewStatus = async (payload) => {
    console.log('computeTestReviewStatus called with:', payload);

    try {
        // Check if we have the expected payload structure
        if (!payload || !payload.issues || !Array.isArray(payload.issues)) {
            console.error('Invalid payload structure:', payload);
            return ["OPEN"]; // Return array with default value
        }

        const issues = payload.issues;
        console.log('Processing issues for test review status:', issues.length);

        // Process each issue to get test review status
        const results = await Promise.all(issues.map(async (issue) => {
            try {
                // Extract JIRA issue key from the issue object
                const issueKey = issue.key || issue.id;
                if (!issueKey) {
                    console.log('No issue key found, returning OPEN');
                    return 'OPEN';
                }

                console.log(`Fetching test review status for issue: ${issueKey}`);

                // Query Supabase for test cases and their reviews linked to this JIRA issue
                const testCases = await supabaseQuery(
                    `test_cases?select=test_reviews(status)&jira_id=eq.${issueKey}`
                );

                if (!testCases || testCases.length === 0) {
                    return 'OPEN';
                }

                // Collect all reviews for this issue
                const allReviews = testCases.flatMap(tc => tc.test_reviews || []);

                if (allReviews.length === 0) {
                    return 'OPEN';
                }

                // Determine overall review status
                const approvedReviews = allReviews.filter(r => r.status === 'APPROVED').length;
                const rejectedReviews = allReviews.filter(r => r.status === 'REJECTED').length;
                const pendingReviews = allReviews.filter(r => r.status === 'PENDING').length;

                if (rejectedReviews > 0) {
                    return 'REJECTED';
                } else if (approvedReviews === allReviews.length) {
                    return 'APPROVED';
                } else if (pendingReviews > 0) {
                    return 'IN REVIEW';
                } else {
                    return 'OPEN';
                }
            } catch (error) {
                console.error(`Error fetching test review status for issue:`, error);
                return 'OPEN'; // Return OPEN in case of error for this specific issue
            }
        }));

        console.log('Returning array of values:', results);
        return results;
    } catch (error) {
        console.error('Error in computeTestReviewStatus:', error);
        return ["OPEN"]; // Return array with default string value in case of error
    }
};

export const computeReleaseSignal = async (payload) => {
    console.log('computeReleaseSignal called with:', payload);

    try {
        // Check if we have the expected payload structure
        if (!payload || !payload.issues || !Array.isArray(payload.issues)) {
            console.error('Invalid payload structure:', payload);
            return ["Review"]; // Return array with default value
        }

        const issues = payload.issues;
        console.log('Processing issues for release signal:', issues.length);

        // Process each issue to get release signal
        const results = await Promise.all(issues.map(async (issue) => {
            try {
                // Extract JIRA issue key from the issue object
                const issueKey = issue.key || issue.id;
                if (!issueKey) {
                    console.log('No issue key found, returning Review');
                    return 'Review';
                }

                console.log(`Fetching release signal for issue: ${issueKey}`);

                // Query Supabase for test cases, reviews, and run items linked to this JIRA issue
                const testCases = await supabaseQuery(
                    `test_cases?select=test_reviews(status),test_run_items(status)&jira_id=eq.${issueKey}`
                );

                if (!testCases || testCases.length === 0) {
                    return 'Review';
                }

                // Collect all reviews and run items for this issue
                const allReviews = testCases.flatMap(tc => tc.test_reviews || []);
                const allRunItems = testCases.flatMap(tc => tc.test_run_items || []);

                // Determine review status
                let reviewStatus = 'OPEN';
                if (allReviews.length > 0) {
                    const approvedReviews = allReviews.filter(r => r.status === 'APPROVED').length;
                    const rejectedReviews = allReviews.filter(r => r.status === 'REJECTED').length;

                    if (rejectedReviews > 0) {
                        reviewStatus = 'REJECTED';
                    } else if (approvedReviews === allReviews.length) {
                        reviewStatus = 'APPROVED';
                    }
                }

                // Determine execution status
                let hasFailures = false;
                let hasExecutedTests = false;

                if (allRunItems.length > 0) {
                    hasFailures = allRunItems.some(item => item.status === 'FAILED');
                    hasExecutedTests = allRunItems.some(item =>
                        ['PASSED', 'FAILED', 'BLOCKED', 'SKIPPED'].includes(item.status)
                    );
                }

                // Determine release signal based on review and execution status
                if (reviewStatus === 'APPROVED' && hasExecutedTests && !hasFailures) {
                    return 'Ready to Ship';
                } else if (hasFailures || reviewStatus === 'REJECTED') {
                    return 'Not Ready';
                } else {
                    return 'Review';
                }
            } catch (error) {
                console.error(`Error fetching release signal for issue:`, error);
                return 'Review'; // Return Review in case of error for this specific issue
            }
        }));

        console.log('Returning array of values for release-signal:', results);
        return results;
    } catch (error) {
        console.error('Error in computeReleaseSignal:', error);
        return ["Review"]; // Return array with default string value in case of error
    }
};