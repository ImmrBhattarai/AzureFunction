// Modern JavaScript with improved functionality
class BarcodeGenerator {
    constructor() {
        this.init();
    }

    // Initialize the app: set default date and bind events
    init() {
        this.setDefaultDate();
        this.bindEvents();
    }

    // Set today's date as the default for the due date input
    setDefaultDate() {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        document.getElementById('dueDate').value = formattedDate;
    }

    // Bind input validation events
    bindEvents() {
        // Form validation on input
        const inputs = document.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateInput(input));
            input.addEventListener('input', () => this.clearInputError(input));
        });
    }

    // Validate a single input field
    validateInput(input) {
        if (!input.value.trim()) {
            input.classList.add('error');
            return false;
        }
        input.classList.remove('error');
        return true;
    }

    // Remove error styling from input
    clearInputError(input) {
        input.classList.remove('error');
    }

    // Show the loader and disable the generate button
    showLoader() {
        document.getElementById('loader').style.display = 'block';
        document.getElementById('resultContent').style.display = 'none';
        document.getElementById('generateButton').disabled = true;
    }

    // Hide the loader and enable the generate button
    hideLoader() {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('generateButton').disabled = false;
    }

    // Show the result section and enable the validate button
    showResult() {
        document.getElementById('resultContent').style.display = 'block';
        document.getElementById('btn-validate-code').disabled = false;
    }

    // Clear validation state from previous results
    clearValidationState() {
        const codeContainer = document.querySelector('.code-container');
        const validationMessage = document.getElementById('validation-message');
        
        // Clear previous states
        codeContainer.classList.remove('barcode-valid', 'barcode-invalid');
        validationMessage.style.display = 'none';
        validationMessage.classList.remove('validation-valid', 'validation-invalid');
    }

    // Show a toast notification
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="toast-icon fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span class="toast-message">${message}</span>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Remove toast after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }

    // Generate a barcode by calling the API
    async generateBarcode() {
        const dueDate = document.getElementById('dueDate').value;
        const value = document.getElementById('value').value;
        
        // Validate inputs
        if (!dueDate || !value) {
            this.showToast('Please fill in all fields.', 'error');
            return;
        }

        if (parseFloat(value) <= 0) {
            this.showToast('Value must be greater than zero.', 'error');
            return;
        }

        this.showLoader();
        this.clearValidationState();
        
        try {
            const response = await fetch('http://192.168.122.169:7167/api/barcode-generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    dueDate: dueDate,
                    value: parseFloat(value)
                })
            });
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();

            // Check for valid imageBase64 and set image or show error
            const barcodeImage = document.getElementById('barcodeImage');
            if (data.imageBase64 && typeof data.imageBase64 === 'string' && data.imageBase64.length > 100) {
                barcodeImage.src = `data:image/png;base64,${data.imageBase64}`;
                barcodeImage.alt = "Generated Barcode";
            } else {
                barcodeImage.src = "";
                barcodeImage.alt = "Barcode image not available";
                this.showToast('Barcode image not available or invalid.', 'error');
            }

            document.getElementById('barcodeText').textContent = data.barcode;
            
            this.showResult();
            this.showToast('Barcode generated successfully!');
            
        } catch (error) {
            console.error('Error generating barcode:', error);
            this.showToast(`Error generating barcode: ${error.message}`, 'error');
        } finally {
            this.hideLoader();
        }
    }

    // Validate the barcode by calling the API
    async validateBarcode() {
        const barcode = document.getElementById('barcodeText').textContent.trim();
        
        if (!barcode) {
            this.showToast('No barcode to validate.', 'error');
            return;
        }

        // Show loading state on validation button
        const btnValidate = document.getElementById('btn-validate-code');
        const originalText = btnValidate.innerHTML;
        btnValidate.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validating...';
        btnValidate.disabled = true;
        
        try {
            // Use VM IP and correct port for validator endpoint
            const response = await fetch('http://192.168.122.169:7062/api/barcode-validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ barcode })
            });
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status} - ${response.statusText}`);
            }
            
            const result = await response.json();
            this.updateValidationUI(result);
            
        } catch (error) {
            console.error('Error validating barcode:', error);
            this.showToast(`Error validating code: ${error.message}`, 'error');
        } finally {
            btnValidate.innerHTML = originalText;
            btnValidate.disabled = false;
        }
    }

    // Update the UI based on validation result
    updateValidationUI(result) {
        const codeContainer = document.querySelector('.code-container');
        const validationMessage = document.getElementById('validation-message');
        
        // Clear previous states
        codeContainer.classList.remove('barcode-valid', 'barcode-invalid');
        validationMessage.classList.remove('validation-valid', 'validation-invalid');
        
        // Use only English field names
        if (result.valid === true) {
            codeContainer.classList.add('barcode-valid');
            validationMessage.textContent = '✓ Barcode is valid!';
            validationMessage.classList.add('validation-valid');
            this.showToast('Barcode is valid!', 'success');
        } else {
            codeContainer.classList.add('barcode-invalid');
            validationMessage.textContent = '✗ Barcode is invalid!';
            validationMessage.classList.add('validation-invalid');
            this.showToast('Barcode is invalid!', 'error');
        }
        
        validationMessage.style.display = 'block';
    }

    // Copy the barcode to clipboard
    copyToClipboard() {
        const barcodeText = document.getElementById('barcodeText').textContent;
        
        if (!barcodeText) {
            this.showToast('No code to copy.', 'error');
            return;
        }

        navigator.clipboard.writeText(barcodeText).then(() => {
            this.showToast('Code copied to clipboard!');
            
            // Visual feedback on copy button
            const copyBtn = document.querySelector('.copy-btn');
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            copyBtn.style.background = 'var(--success-color)';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.style.background = '';
            }, 1500);
            
        }).catch(err => {
            console.error('Error copying:', err);
            this.showToast('Error copying code.', 'error');
        });
    }
}

// Initialize the application
const app = new BarcodeGenerator();

// Global functions for HTML onclick handlers (backward compatibility)
function generateBarcode() {
    app.generateBarcode();
}

function validateCode() {
    app.validateBarcode();
}

function copyToClipboard() {
    app.copyToClipboard();
}

