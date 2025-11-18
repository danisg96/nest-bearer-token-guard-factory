# Code Snippets

## Complete Factory Implementation

Copy this into `guards/BearerToken.guard.ts`:
```typescript
// guards/bearer-auth.guard.ts
import { CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'

export class BearerAuthGuard implements CanActivate {
	constructor(private readonly expectedToken: string) {}

	canActivate(context: ExecutionContext): boolean {
		if (!this.expectedToken) {
			throw new Error('Bearer token is not configured')
		}

		const request = context.switchToHttp().getRequest()
		const authHeader = request.headers.authorization

		if (!authHeader) {
			throw new UnauthorizedException('Missing authorization header')
		}

		const [type, token] = authHeader.split(' ')

		if (type !== 'Bearer') {
			throw new UnauthorizedException('Invalid authorization type')
		}

		if (token !== this.expectedToken) {
			throw new UnauthorizedException('Invalid token')
		}

		return true
	}
}

```
