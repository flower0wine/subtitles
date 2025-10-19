import { ExamplesObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";

export const getBadRequestContent = (examples: ExamplesObject | undefined) => {
  return {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: false },
          code: { type: "number", description: "错误码" },
          message: { type: "string" },
          error: { type: "object", nullable: true }
        }
      },
      examples
    }
  };
};
