import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

type LambdaFunctionNames = "lociBackendApp" | "lociChatHandler";

// Add more function names as needed

export type LambdaFunctionsType = {
  [key in LambdaFunctionNames]?: LambdaIntegration | NodejsFunction;
};
