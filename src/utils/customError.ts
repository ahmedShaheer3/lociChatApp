export class CustomError extends Error {
  constructor(
    public message: string,
    public code: number,
  ) {
    super(message);
    this.code = code;
  }
}
