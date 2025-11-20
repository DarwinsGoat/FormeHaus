document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('quoteForm');
  const fileInput = document.getElementById('fileInput');
  const fileUploadArea = document.getElementById('fileUploadArea');
  const fileName = document.getElementById('fileName');
  const submitBtn = document.getElementById('submitBtn');

  // Track CTA button clicks
  const ctaButtons = document.querySelectorAll('.cta-btn');
  ctaButtons.forEach(button => {
    button.addEventListener('click', function() {
      console.log('CTA button clicked');
      if (typeof fbq !== 'undefined') {
        fbq('track', 'InitiateCheckout');
        console.log('InitiateCheckout event fired');
      } else {
        console.log('fbq not defined');
      }
    });
  });
  
  fileUploadArea.addEventListener('click', function() {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', function(e) {
    handleFileSelect(e.target.files[0]);
  });
  
  fileUploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    fileUploadArea.classList.add('dragover');
  });
  
  fileUploadArea.addEventListener('dragleave', function() {
    fileUploadArea.classList.remove('dragover');
  });
  
  fileUploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  });
  
  function handleFileSelect(file) {
    if (!file) return;
    
    const validTypes = ['.stl', '.obj'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(fileExt)) {
      showError('fileError', 'Please upload a .stl or .obj file');
      return;
    }
    
    const maxSize = 250 * 1024 * 1024;
    if (file.size > maxSize) {
      showError('fileError', 'File size must be less than 250MB');
      return;
    }
    
    fileName.textContent = '✓ ' + file.name;
    hideError('fileError');
    
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;
  }
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    clearAllErrors();

    if (!validateForm()) {
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = originalText + ' <span class="spinner"></span>';

    const formData = new FormData(form);

    // Generate event_id for deduplication between pixel and CAPI
    const eventId = 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    formData.append('event_id', eventId);

    // Get Facebook browser cookies for better matching
    const fbp = getCookie('_fbp');
    const fbc = getCookie('_fbc');
    if (fbp) formData.append('fbp', fbp);
    if (fbc) formData.append('fbc', fbc);

    try {
      const response = await fetch('/api/submitForm', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        console.log('Form submitted successfully');

        if (typeof gtag !== 'undefined') {
          gtag('event', 'quote_submit', {
            event_category: 'lead',
            value: 1
          });
        }

        if (typeof fbq !== 'undefined') {
          fbq('track', 'Lead', {}, { eventID: eventId });
          console.log('Lead event fired with eventID:', eventId);
        } else {
          console.log('fbq not defined for Lead event');
        }
        
        document.getElementById('quoteForm').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';
        document.getElementById('successMessage').scrollIntoView({ behavior: 'smooth' });
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      showError('formError');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
  
  function validateForm() {
    let isValid = true;
    
    const name = document.getElementById('name').value.trim();
    if (!name) {
      showError('nameError');
      isValid = false;
    }
    
    const email = document.getElementById('email').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showError('emailError');
      isValid = false;
    }
    
    const description = document.getElementById('description').value.trim();
    if (!description) {
      showError('descriptionError');
      isValid = false;
    }
    
    const material = document.getElementById('material').value;
    if (!material) {
      showError('materialError');
      isValid = false;
    }
    
    const finishing = document.getElementById('finishing').value;
    if (!finishing) {
      showError('finishingError');
      isValid = false;
    }
    
    if (!fileInput.files || fileInput.files.length === 0) {
      showError('fileError');
      isValid = false;
    }
    
    return isValid;
  }
  
  function showError(errorId, customMessage) {
    const errorElement = document.getElementById(errorId);
    if (customMessage) {
      errorElement.textContent = customMessage;
    }
    errorElement.classList.add('show');
  }
  
  function hideError(errorId) {
    const errorElement = document.getElementById(errorId);
    errorElement.classList.remove('show');
  }
  
  function clearAllErrors() {
    const errors = document.querySelectorAll('.error-message');
    errors.forEach(error => error.classList.remove('show'));
  }
  
  document.getElementById('email').addEventListener('blur', function() {
    const email = this.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      showError('emailError');
    } else {
      hideError('emailError');
    }
  });

  // Helper function to get cookies
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }
});
