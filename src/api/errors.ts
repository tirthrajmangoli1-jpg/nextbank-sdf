export class BaseApiError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, code: string, statusCode: number = 400) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InsufficientFundsError extends BaseApiError {
  constructor(message: string = 'Insufficient account balance for this transaction') {
    super(message, 'INSUFFICIENT_FUNDS', 400);
  }
}

export class InvalidCredentialsError extends BaseApiError {
  constructor(message: string = 'Invalid email or password') {
    super(message, 'INVALID_CREDENTIALS', 401);
  }
}

export class DailyLimitExceededError extends BaseApiError {
  constructor(
    message: string = 'This transfer exceeds your daily transfer limit',
    public remainingLimitPaise: number = 0
  ) {
    super(message, 'DAILY_LIMIT_EXCEEDED', 400);
  }
}

export class AccountNotFoundError extends BaseApiError {
  constructor(message: string = 'Bank account not found') {
    super(message, 'ACCOUNT_NOT_FOUND', 404);
  }
}

export class BeneficiaryNotFoundError extends BaseApiError {
  constructor(message: string = 'Beneficiary not found') {
    super(message, 'BENEFICIARY_NOT_FOUND', 404);
  }
}

export class CoolingPeriodActiveError extends BaseApiError {
  constructor(
    message: string = 'Transfers to newly added beneficiaries are locked during the 30-second cooling period',
    public secondsRemaining: number = 30
  ) {
    super(message, 'COOLING_PERIOD_ACTIVE', 403);
  }
}

export class InvalidOtpError extends BaseApiError {
  constructor(message: string = 'Invalid or expired 6-digit OTP') {
    super(message, 'INVALID_OTP', 400);
  }
}

export class NetworkError extends BaseApiError {
  constructor(
    message: string = 'Network failure: Unable to reach simulated backend service'
  ) {
    super(message, 'NETWORK_ERROR', 503);
  }
}

export class ValidationError extends BaseApiError {
  constructor(message: string = 'Validation failed') {
    super(message, 'VALIDATION_ERROR', 422);
  }
}

export class UnauthorizedError extends BaseApiError {
  constructor(message: string = 'Session expired or unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}
