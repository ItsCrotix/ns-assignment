import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  try {
    /**
     * Fetches trip data based on the provided event and stores the result.
     */
    const result = await fetchTripData(event);

    return {
      statusCode: result.statusCode,
      body: JSON.stringify(result.body),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: (error as Error).message,
        stack: (error as Error).stack,
        input: event,
      }),
    };
  }
};

/**
 * Fetches trip data from the NS API based on the provided event parameters.
 */
const fetchTripData = async (event: APIGatewayEvent) => {
  if (!event.queryStringParameters) {
    throw new Error("Missing query string parameters");
  }

  const { arrivalStation, departureStation, departureDate } =
    event.queryStringParameters;

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

  const data = await res.json();

  if (data.length === 0) {
    return {
      statusCode: 404,
      body: { error: "No data available" },
    };
  }

  if (res.ok) {
    return {
      statusCode: 200,
      body: sortData(data),
    };
  }

  // handle 500 error
  return {
    statusCode: 500,
    body: { error: "Internal server error" },
  };
};

/**
 * Sorts trip data by planned and actual duration, and returns the best option.
 */
const sortData = (data: TripData) => {
  const trips = data.trips;

  const sortedByPlannedDuration = trips
    .slice()
    .sort((a, b) => a.plannedDurationInMinutes - b.plannedDurationInMinutes);
  const sortedByActualDuration = trips
    .slice()
    .sort((a, b) => a.actualDurationInMinutes - b.actualDurationInMinutes);

  const bestOption =
    sortedByActualDuration[0].actualDurationInMinutes <
    sortedByPlannedDuration[0].plannedDurationInMinutes
      ? sortedByActualDuration[0]
      : sortedByPlannedDuration[0];

  return bestOption;
};

interface Trip {
  plannedDurationInMinutes: number;
  actualDurationInMinutes: number;
}

interface TripData {
  trips: Trip[];
}
