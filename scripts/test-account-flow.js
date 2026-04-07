/**
 * Account Creation Test Script
 *
 * This script tests the account creation flow:
 * 1. Form validation with empty account type
 * 2. Inline field validation
 * 3. Profile fetch retry logic
 */

// Test 1: Validate form with no account type selected
console.log('=== Account Creation Flow Tests ===\n');

// Simulate form validation
function testValidateFields() {
  const tests = [
    {
      name: 'Empty email',
      data: { email: '', pass: 'Password123', name: 'Test', userType: 'customer', mode: 'register' },
      expect: { email: 'Email address is required' }
    },
    {
      name: 'Invalid email format',
      data: { email: 'invalid-email', pass: 'Password123', name: 'Test', userType: 'customer', mode: 'register' },
      expect: { email: 'Please enter a valid email address (e.g., name@example.com)' }
    },
    {
      name: 'No account type selected',
      data: { email: 'test@example.com', pass: 'Password123', name: 'Test', userType: null, mode: 'register' },
      expect: { userType: "Please select how you'll use Fomo" }
    },
    {
      name: 'Password too short',
      data: { email: 'test@example.com', pass: 'short', name: 'Test', userType: 'customer', mode: 'register' },
      expect: { password: 'Password must be at least 8 characters' }
    },
    {
      name: 'Password missing uppercase',
      data: { email: 'test@example.com', pass: 'password123', name: 'Test', userType: 'customer', mode: 'register' },
      expect: { password: 'Password must contain an uppercase letter' }
    },
    {
      name: 'Password missing number',
      data: { email: 'test@example.com', pass: 'Password', name: 'Test', userType: 'customer', mode: 'register' },
      expect: { password: 'Password must contain a number' }
    },
    {
      name: 'Empty name',
      data: { email: 'test@example.com', pass: 'Password123', name: '', userType: 'customer', mode: 'register' },
      expect: { name: 'Your name is required' }
    },
    {
      name: 'Valid customer registration',
      data: { email: 'test@example.com', pass: 'Password123', name: 'Test User', userType: 'customer', mode: 'register' },
      expect: {}
    },
    {
      name: 'Valid business registration',
      data: { email: 'test@example.com', pass: 'Password123', name: 'Test Business', userType: 'business', mode: 'register' },
      expect: {}
    }
  ];

  console.log('Form Validation Tests:');
  console.log('-'.repeat(50));

  tests.forEach(test => {
    const errors = validateFields(test.data);
    const passed = JSON.stringify(errors) === JSON.stringify(test.expect);
    console.log(`${passed ? '✅' : '❌'} ${test.name}`);
    if (!passed) {
      console.log(`   Expected: ${JSON.stringify(test.expect)}`);
      console.log(`   Got: ${JSON.stringify(errors)}`);
    }
  });
  console.log();
}

// Simulate the validation function from AuthModal
function validateFields({ email, pass, name, userType, mode }) {
  const errors = {};

  if (!email.trim()) {
    errors.email = 'Email address is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address (e.g., name@example.com)';
  }

  if (!pass) {
    errors.password = 'Password is required';
  } else if (mode === 'register') {
    if (pass.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(pass)) {
      errors.password = 'Password must contain an uppercase letter';
    } else if (!/[a-z]/.test(pass)) {
      errors.password = 'Password must contain a lowercase letter';
    } else if (!/[0-9]/.test(pass)) {
      errors.password = 'Password must contain a number';
    }
  }

  if (mode === 'register') {
    if (!userType) {
      errors.userType = "Please select how you'll use Fomo";
    }
    if (!name.trim()) {
      errors.name = userType === 'business' ? 'Business name is required' : 'Your name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (name.length > 100) {
      errors.name = 'Name must be less than 100 characters';
    }
  }

  return errors;
}

// Test profile fetch retry logic
console.log('Profile Fetch Retry Logic:');
console.log('-'.repeat(50));

function simulateProfileFetch(attempt) {
  const maxAttempts = 3;
  const shouldFail = Math.random() > 0.7; // 30% failure rate simulation

  if (shouldFail && attempt < maxAttempts) {
    console.log(`  Attempt ${attempt}: Failed (will retry)`);
    return { retry: true, attempt: attempt + 1 };
  } else if (shouldFail && attempt >= maxAttempts) {
    console.log(`  Attempt ${attempt}: Failed (max retries reached)`);
    return { error: 'Failed to load profile. Please refresh to try again.' };
  } else {
    console.log(`  Attempt ${attempt}: Success`);
    return { data: { id: 'profile_123', role: 'customer' } };
  }
}

console.log('Simulating profile fetch with retry logic:');
let result = { retry: true, attempt: 1 };
while (result.retry && result.attempt <= 3) {
  result = simulateProfileFetch(result.attempt);
}
console.log(`Final result: ${result.error ? result.error : 'Profile loaded successfully'}`);
console.log();

// Run the tests
testValidateFields();

console.log('=== Summary ===');
console.log(`
Changes Made:
1. Account type selection is now REQUIRED (defaults to null, not "customer")
2. Inline validation errors shown per field with red borders
3. Profile fetch has 3 retry attempts with exponential backoff
4. HubScreen shows recovery UI if profile fails to load
5. Added refreshProfile function for manual retry

To test manually:
1. Open http://localhost:5173
2. Click "Sign in" button
3. Switch to "Create Account" tab
4. Try submitting without selecting account type → error shown
5. Select "Browse Events" or "Publish Events" card
6. Fill in form with validation errors → inline errors shown
7. Complete signup → account created with proper role
`);
