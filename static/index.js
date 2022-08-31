const authButton = document.querySelector('.auth-button');
const guestButton = document.querySelector('.guest-button');

const authStub = document.querySelector('.auth-stub');
const signInForm = document.querySelector('.sign-in-form');
const logInTab = document.querySelector('.login-tab');
const registerTab = document.querySelector('.register-tab');
const registerTabAnchor = document.querySelector('.register-anchor');

const usernameInput = document.querySelector('.username-input');
const passwordInput = document.querySelector('.password-input');
const passwordConfirmInput = document.querySelector('.password-confirm-input');
const confirmPasswordField = document.querySelector('.confirm-password-field');

const submitButton = document.querySelector('.submit-button');
const cancelButton = document.querySelector('.cancel-button');

const fieldsMessage = document.querySelector('.fields-message');
const passwordMessage = document.querySelector('.password-message');
const errorMessage = document.querySelector('.error-message');

let registerToggle = false;

authButton.addEventListener('click', (event) => {
  event.preventDefault();
  authStub.classList.add('is-hidden');
  signInForm.classList.remove('is-hidden');
  usernameInput.focus();
});

guestButton.addEventListener('click', (event) => {
  event.preventDefault();

  window.location.href = '/game';
});

logInTab.addEventListener('click', (event) => {
  if ([logInTab.classList].includes('is-active')) {
    return;
  }

  registerToggle = false;

  registerTab.classList.toggle('is-active');
  registerTabAnchor.classList.toggle('has-text-primary');
  logInTab.classList.toggle('is-active');

  confirmPasswordField.classList.add('is-hidden');

  submitButton.innerHTML = 'Log in';
  submitButton.classList.toggle('is-info');
  submitButton.classList.toggle('is-primary');

  usernameInput.placeholder = 'username';
  passwordInput.placeholder = 'password';
  usernameInput.focus();
});

registerTab.addEventListener('click', (event) => {
  if ([registerTab.classList].includes('is-active')) {
    return;
  }

  registerToggle = true;

  registerTab.classList.toggle('is-active');
  registerTabAnchor.classList.toggle('has-text-primary');
  logInTab.classList.toggle('is-active');

  confirmPasswordField.classList.remove('is-hidden');

  submitButton.innerHTML = 'Register';
  submitButton.classList.toggle('is-info');
  submitButton.classList.toggle('is-primary');

  usernameInput.placeholder = '6 to 12 symbols';
  passwordInput.placeholder = '8 to 16 symbols';
  usernameInput.focus();
});

submitButton.addEventListener('click', async (event) => {
  event.preventDefault();

  errorMessage.classList.add('is-hidden');

  if (
    !(usernameInput.value) 
    || !(passwordInput.value)
    || (registerToggle & !(passwordConfirmInput.value))
  ) {
    fieldsMessage.classList.remove('is-hidden');
    return;
  }

  if (registerToggle & (passwordInput.value !== passwordConfirmInput.value)) {
    passwordMessage.classList.remove('is-hidden');
    return;
  }

  const captcha = grecaptcha.getResponse();

  const uri = registerToggle ? 'signup' : 'login';
  const username = usernameInput.value;
  const password = passwordInput.value;
  const res = await axios.post(`/api/v1/${uri}`, { username, password, captcha });
  const { isLoggedIn } = res.data;
  if (!isLoggedIn) {
    errorMessage.innerHTML = res.data.message;
    errorMessage.classList.remove('is-hidden');
    return;
  }
  localStorage.setItem('isLoggedIn', 'true');
  window.location.href = '/stats';
});

cancelButton.addEventListener('click', (event) => {
  event.preventDefault();
  signInForm.classList.add('is-hidden');
  fieldsMessage.classList.add('is-hidden');
  errorMessage.classList.add('is-hidden');
  passwordMessage.classList.add('is-hidden');

  authStub.classList.remove('is-hidden');
});
