class ApiResponse {
  constructor(statusCode, data, messege = "Success") {
    // console.log(statusCode, data, messege);
    this.statusCode = statusCode;
    this.data = data;
    this.messege = messege;
    this.success = statusCode < 400;
  }
}
export { ApiResponse };
