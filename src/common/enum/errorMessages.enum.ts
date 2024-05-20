export enum ErrorMessages {
  // USER
  USER_NOT_FOUND = 'No se encontro ningun usuario con el email',
  USER_EMAIL_EXISTS = 'El email ya existe!',
  USER_EMAIL_NOT_VERIFIED = 'El email no ha sido verificado!',
  USER_NOT_AUTH = 'El email o la contraseña son invalidos!',

  // COMPANY
  COMPANY_NOT_FOUND = 'No se encontro ninguna compania con el id',

  // COMPANY
  ROLE_NAME_TAKEN = 'El rol ya existe',

  // ACTIVATION CODE
  ACTIVATION_CODE_LENGTH = 'El codigo de activacion tine que ser de 6 caracteres',
  ACTIVATION_CODE_NOT_VALID = 'El codigo de validacion es incorrecto!',
  ACTIVATION_CODE_EXPIRED = 'El codido de verificacion expiro!',
  ACCOUNT_ALREADY_VALIDATED = 'La cuenta ya fue validada',
}
