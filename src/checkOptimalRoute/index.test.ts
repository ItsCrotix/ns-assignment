import { APIGatewayEvent } from "aws-lambda";
import { handler } from "./index";

describe("checkOptimalRoute handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("should return 500 if query string parameters are missing", async () => {
    const event: APIGatewayEvent = {
      queryStringParameters: null,
    } as any;

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).error).toBe(
      "Missing query string parameters"
    );
  });

  it("should return 500 if required query string parameters are missing", async () => {
    const event: APIGatewayEvent = {
      queryStringParameters: {
        arrivalStation: "Amsterdam",
      },
    } as any;

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).error).toBe(
      "Missing required query string parameters"
    );
  });

  it("should return 404 if no data is available", async () => {
    const event: APIGatewayEvent = {
      queryStringParameters: {
        arrivalStation: "Amsterdam",
        departureStation: "Rotterdam",
        departureDate: "2023-10-10T10:00:00",
      },
    } as any;

    global.fetch = jest
      .fn()
      .mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));

    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).error).toBe("No data available");
  });

  it("should return 200 with sorted trip data", async () => {
    const event: APIGatewayEvent = {
      queryStringParameters: {
        arrivalStation: "Amsterdam",
        departureStation: "Rotterdam",
        departureDate: "2023-10-10T10:00:00",
      },
    } as any;

    const tripData = {
      trips: [
        { plannedDurationInMinutes: 60, actualDurationInMinutes: 70 },
        { plannedDurationInMinutes: 50, actualDurationInMinutes: 55 },
      ],
    };

    global.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(tripData), { status: 200 })
      );

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.plannedDurationInMinutes).toBe(50);
    expect(body.actualDurationInMinutes).toBe(55);
  });

  it("should return the correct error message if missing parameters", async () => {
    const event: APIGatewayEvent = {
      queryStringParameters: null,
    } as any;

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toBe("Missing query string parameters");
  });

  it("should return the correct error message if fetch fails", async () => {
    const event: APIGatewayEvent = {
      queryStringParameters: {
        arrivalStation: "Amsterdam",
        departureStation: "Rotterdam",
        departureDate: "2023-10-10T10:00:00",
      },
    } as any;

    global.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ message: "Error" }), { status: 500 })
      );

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Error");
  });
});
