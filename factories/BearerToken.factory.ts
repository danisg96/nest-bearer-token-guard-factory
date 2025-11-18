// guards/bearer-auth.factory.ts
import { Injectable, mixin, Type } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BearerAuthGuard } from '../guards/BearerToken.guard'

export function createBearerAuthGuard(tokenKey: string): Type<BearerAuthGuard> {
    @Injectable()
	class BearerAuthGuardHost extends BearerAuthGuard {
		constructor(configService: ConfigService) {
			const token = configService.get<string>(tokenKey)
			if (!token) {
				throw new Error(`Token key "${tokenKey}" is not configured`)
			}
			super(token)
		}
	}

	return mixin(BearerAuthGuardHost)
}
