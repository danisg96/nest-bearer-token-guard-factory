# NestJS Bearer Token Guard

## Overview
Factory pattern implementation for creating Bearer token guards in NestJS applications.

## Quick Example

\```typescript
import { createBearerGuard } from './guards/bearer.factory';

// In your controller
@UseGuards(createBearerGuard('key_path_in_configService'))
@Get('protected')
async getProtectedResource() {
  return { message: 'Authorized!' };
}
\```

## Installation

Copy the guard factory from `/src/guards/bearer.factory.ts` to your project.

## Requirements
- NestJS 8+
- @nestjs/jwt
- @nestjs/passport