## Integration Example
```typescript
// some.controller.ts
import { createBearerAuthGuard } from '@factory/BearerGuard.factory';

const MyBearerGuard = createBearerAuthGuard('api.secret');

@Module({
  providers: [MyBearerGuard],
})
export class AppModule {}
```

### Note
'api.secret' is the path of the bearer token in yor configuration injected in ConfigService
