const request = require('supertest');
const app = require('../../App');
const httpStatusText = require('../../utils/constants/httpStatusText');

// mock for Email class to avoid sending real emails to users
jest.mock('../../utils/email', () => {
  return jest.fn().mockImplementation(() => ({
    sendContactConfirmation: jest.fn().mockResolvedValue(true),
    sendContactToAdmin: jest.fn().mockResolvedValue(true)
  }));
});

describe("📬 Contact Email API", () => {
  it("should return 400 if required fields are missing", async () => {
    const res = await request(app)
      .post("/emails")
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe(httpStatusText.FAIL);
  });

  it("should create a mail and return 200 with data", async () => {
    const res = await request(app)
      .post("/emails")
      .send({
        fullName: "Ahmed M. Ezz",
        email: "ahmed.mohamed.ezzeldeen@gmail.com",
        phoneNumber: "01000000000",
        subject: "Hello",
        messageBody: "This is a test message"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("email", "ahmed.mohamed.ezzeldeen@gmail.com");
  });
});
