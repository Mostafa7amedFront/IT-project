document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('.custom-validate');

  forms.forEach(form => {
    form.addEventListener('submit', function(event) {
      event.preventDefault(); // Prevent default HTML5 validation submission
      
      let isValid = true;
      const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
      
      // Clear all previous custom error messages
      form.querySelectorAll('.custom-error-msg').forEach(msg => msg.remove());
      inputs.forEach(input => input.classList.remove('input-error'));

      inputs.forEach(input => {
        if (!input.value.trim()) {
          isValid = false;
          showCustomError(input, 'This field is required.');
        } else if (input.type === 'email' && !validateEmail(input.value)) {
          isValid = false;
          showCustomError(input, 'Please enter a valid email address.');
        } else if (input.type === 'password' && input.value.length < 8) {
          isValid = false;
          showCustomError(input, 'Password must be at least 8 characters long.');
        }
      });

      // Special check for password confirmation
      const password = form.querySelector('input[name="password"]');
      const confirmPassword = form.querySelector('input[name="confirm_password"]');
      
      if (password && confirmPassword && password.value !== confirmPassword.value) {
        isValid = false;
        showCustomError(confirmPassword, 'Passwords do not match.');
      }

      if (isValid) {
        // Show success message dynamically
        const successMsg = document.createElement('div');
        successMsg.className = 'form-success-msg';
        successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Form submitted successfully!';
        form.prepend(successMsg);
        
        // Reset form
        form.reset();
        
        // Remove success message after 3 seconds
        setTimeout(() => successMsg.remove(), 3000);
      }
    });
  });

  function showCustomError(input, message) {
    input.classList.add('input-error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'custom-error-msg';
    errorDiv.textContent = message;
    
    // Insert error message after the input element
    input.parentNode.insertBefore(errorDiv, input.nextSibling);
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
});
