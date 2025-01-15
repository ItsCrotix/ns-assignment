import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  APIGatewayProxyEvent,
  APIGatewayEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Leg, TripData } from "../types";

const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const result = await fetchTripData(event);
    return {
      statusCode: result.statusCode,
      body: JSON.stringify(result.body),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};

/**
 * Fetches trip data from the NS API based on the provided event's query parameters.
 *
 * @param {APIGatewayProxyEvent} event - The API Gateway event containing query parameters.
 * @returns {Promise<{ statusCode: number, body: any }>} - The response object containing the status code and body.
 *
 * Query Parameters:
 * - `arrivalStation`: The station where the trip ends.
 * - `departureStation`: The station where the trip starts.
 * - `departureDate`: The date and time of departure.
 *
 * Response:
 * - `statusCode`: The HTTP status code of the response.
 * - `body`: The response body, which includes either the trip data or an error message.
 *
 * The function performs the following steps:
 * 1. Extracts query parameters from the event.
 * 2. Constructs the URL with the query parameters.
 * 3. Fetches trip data from the NS API.
 * 4. Checks if the response is successful.
 * 5. If no trips are found, returns a 404 status with an error message.
 * 6. Extracts unique journey detail references from the trip data.
 * 7. Fetches detailed train information using the journey detail references.
 * 8. Attaches journey details to each leg of the trips.
 * 9. Sorts the trips based on a complex sorting algorithm.
 * 10. Returns the best and worst trips in the response body.
 */
const fetchTripData = async (
  event: APIGatewayEvent
): Promise<{ statusCode: number; body: any }> => {
  const { arrivalStation, departureStation, departureDate } =
    event.queryStringParameters || {};

  if (!arrivalStation || !departureStation || !departureDate) {
    throw new Error("Missing required query string parameters");
  }

  const urlParams = new URLSearchParams({
    fromStation: arrivalStation,
    toStation: departureStation,
    dateTime: departureDate,
  });

  const res = await fetch(
    `https://gateway.apiportal.ns.nl/reisinformatie-api/api/v3/trips?${urlParams}`,
    {
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.NS_API_KEY || "",
      },
    }
  );

  if (!res.ok) {
    return {
      statusCode: res.status,
      body: await res.json(),
    };
  }

  const data: { trips: TripData[] } = await res.json();

  if (data.trips.length === 0) {
    return {
      statusCode: 404,
      body: { error: "No data available" },
    };
  }

  const journeyDetailRefs = [
    ...new Set(
      data.trips.flatMap((trip: TripData) =>
        trip.legs.map((leg) => leg.product.number as string)
      )
    ),
  ];
  const journeyDetails = await fetchTrainDetailsWithCache(journeyDetailRefs);

  data.trips.forEach((trip: TripData) => {
    trip.legs.forEach((leg) => {
      const detail = journeyDetails.find((journey) =>
        journey.productNumbers.includes(leg.product.number)
      );
      leg.journeyDetail = detail;
    });
  });

  data.trips = complexSort(data.trips);

  return {
    statusCode: 200,
    body: { best: data.trips[0], worst: data.trips[data.trips.length - 1] },
  };
};

/**
 * Fetches train details for a list of product numbers with caching.
 *
 * This function takes an array of product numbers, checks if the details for each product number
 * are available in the cache, and if not, fetches the details from an external source and caches them.
 *
 * @param {string[]} productNumbers - An array of product numbers for which to fetch train details.
 * @returns {Promise<any[]>} A promise that resolves to an array of train details.
 */
export const fetchTrainDetailsWithCache = async (productNumbers: string[]) => {
  const results = await Promise.all(
    productNumbers.map(async (productNumber) => {
      const cachedDetail = await getCachedTrainDetail(productNumber);
      if (cachedDetail) {
        return cachedDetail;
      } else {
        const detail = await fetchTrainDetail(productNumber);
        await cacheTrainDetail(productNumber, detail);
        return detail;
      }
    })
  );
  return results;
};

/**
 * Fetches the details of a train journey based on the provided product number.
 *
 * @param {string} productNumber - The product number of the train.
 * @returns {Promise<any>} A promise that resolves to the payload containing train journey details.
 *
 * @throws {Error} If the fetch request fails or the response cannot be parsed as JSON.
 */
const fetchTrainDetail = async (productNumber: string) => {
  const queryParams = new URLSearchParams({ train: productNumber });

  const res = await fetch(
    `https://gateway.apiportal.ns.nl/reisinformatie-api/api/v2/journey?${queryParams}`,
    {
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.NS_API_KEY || "",
      },
    }
  );

  const data = (await res.json()) as { payload: any };
  return data.payload;
};

/**
 * Sorts an array of trips based on a custom comfort score.
 *
 * The comfort score is calculated based on the following criteria:
 * - Each facility in the train parts of the trip legs adds 1 point.
 * - Crowd forecast of the trip legs adds points as follows:
 *   - "LOW": 5 points
 *   - "MEDIUM": 4 points
 *   - "HIGH": 3 points
 *   - "VERY_HIGH": 2 points
 *   - Any other value: 1 point
 * - The number of transfers is subtracted from the total points.
 *
 * @param {TripData[]} trips - An array of trip data to be sorted.
 * @returns {TripData[]} - The sorted array of trips, with the highest comfort score first.
 */
const complexSort = (trips: TripData[]) => {
  return trips
    .map((trip) => {
      let points = 0;

      trip.legs.forEach((leg: Leg) => {
        leg.journeyDetail.stops.forEach((stop) => {
          stop.actualStock?.trainParts.forEach((trainPart) => {
            if (trainPart.facilities) {
              points += trainPart.facilities.length;
            }
          });
        });

        switch (leg.crowdForecast) {
          case "LOW":
            points += 5;
            break;
          case "MEDIUM":
            points += 4;
            break;
          case "HIGH":
            points += 3;
            break;
          case "VERY_HIGH":
            points += 2;
            break;
          default:
            points += 1;
        }
      });
      points -= trip.transfers;

      return { ...trip, points };
    })
    .sort((a, b) => b.points - a.points);
};

/**
 * Retrieves the cached train detail from the DynamoDB table.
 *
 * @param {string} productNumber - The product number of the train.
 * @returns {Promise<any | null>} - A promise that resolves to the train detail if found, otherwise null.
 */
const getCachedTrainDetail = async (
  productNumber: string
): Promise<any | null> => {
  const params = {
    TableName: process.env.NSPRODUCTCACHE_TABLE_NAME,
    Key: { productNumber: productNumber.toString() },
  };

  const result = await dynamoDb.send(new GetCommand(params));
  return result.Item ? result.Item.detail : null;
};

/**
 * Caches the train detail in a DynamoDB table.
 *
 * @param {string} productNumber - The product number of the train.
 * @param {any} detail - The detail information of the train to be cached.
 * @returns {Promise<void>} A promise that resolves when the caching operation is complete.
 */
const cacheTrainDetail = async (
  productNumber: string,
  detail: any
): Promise<void> => {
  const params = {
    TableName: process.env.NSPRODUCTCACHE_TABLE_NAME,
    Item: {
      productNumber: productNumber.toString(),
      detail: detail,
    },
  };

  await dynamoDb.send(new PutCommand(params));
};
