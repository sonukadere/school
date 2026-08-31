/**
 * Standard success response envelope.
 *
 * { success: true, message, data, meta }
 */
class ApiResponse {
  constructor(statusCode, message = 'Operation completed successfully', data = null, meta = undefined) {
    this.statusCode = statusCode;
    this.success = true;
    this.message = message;
    this.data = data;
    if (meta !== undefined) {
      this.meta = meta;
    }
  }
}

export default ApiResponse;
