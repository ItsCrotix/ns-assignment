import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
jest.mock("@aws-sdk/client-dynamodb");
import { APIGatewayEvent } from "aws-lambda";
import { fetchTrainDetailsWithCache } from "./index";
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
      "Missing required query string parameters"
    );
  });

  it("should return 500 if required query string parameters are partially missing", async () => {
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

    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "No data available" }), {
        status: 404,
      })
    );

    const result = await handler(event);

    expect(result.statusCode).toBe(404);

    expect(JSON.parse(result.body).error).toBe("No data available");
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
        new Response(JSON.stringify({ error: "Error" }), { status: 500 })
      );

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toBe("Error");
  });

  it("should fetch train details with caching", async () => {
    const productNumbers = ["123", "456"];
    const mockGetCommand = jest
      .fn()
      .mockResolvedValue({ Item: { detail: "cachedDetail" } });
    const mockPutItemCommand = jest.fn().mockResolvedValue({});
    (DynamoDBClient.prototype.send as jest.Mock).mockImplementation(
      (command) => {
        if (command instanceof GetCommand) {
          return mockGetCommand(command);
        } else if (command instanceof PutCommand) {
          return mockPutItemCommand(command);
        }
      }
    );

    const result = await fetchTrainDetailsWithCache(productNumbers);

    expect(mockGetCommand).toHaveBeenCalledTimes(2);
    expect(mockPutItemCommand).toHaveBeenCalledTimes(0);
    expect(result).toEqual(["cachedDetail", "cachedDetail"]);
  });
});
