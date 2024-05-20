import * as express from "express";
import { GoogleAuthService } from "@services/auth/google-auth.service";
import { inject } from "inversify";
import { controller, httpGet, httpPost } from "inversify-express-utils";
import { setRefreshTokenCookie } from "@utils/token.utils";
import {IGoogleUserResult} from "@interfaces/IGoogleUserResult";
import {IGoogleUserInfo} from "@interfaces/IGoogleUserInfo";

@controller("/tokens/oauth/google")
export class GoogleAuthController {
    private readonly googleAuthService: GoogleAuthService;
    private readonly googlePassword = process.env.GOOGLE_PASSWORD || "gldcart123";

    public constructor(
        @inject(GoogleAuthService) googleAuthService: GoogleAuthService,
    ) {
        this.googleAuthService = googleAuthService;
    }

    @httpGet("/")
    public async googleAuthWebhook(
        request: express.Request,
        response: express.Response,
    ) {
        try {
            const code = request.query.code as string;
            const customParameter = request.query.state as string;
            const oAuthTokens = await this.googleAuthService.getGoogleOAuthTokens({
                code,
            });
            if (oAuthTokens == null) {
                return;
            }
            const googleUser = (await this.googleAuthService.getGoogleUser(
                oAuthTokens.id_token,
                oAuthTokens.access_token,
            )) as IGoogleUserResult;

            this._validateGoogleUser(googleUser, response);

            const userInfo: IGoogleUserInfo = {
                code: code,
                type: customParameter,
                name: googleUser.given_name,
                surname: googleUser.family_name,
                email: googleUser.email,
                picture: googleUser.picture,
                password: this.googlePassword,
            };
            console.log(userInfo);

            const result = await this.googleAuthService.loginGoogleUser(userInfo);
            setRefreshTokenCookie(response, result.tokens.refreshToken);
            const redirectURL = `${process.env.CLIENT_URL}` as string;
            response.redirect(redirectURL);
        } catch (error: any) {
            this._handleAuthError(response, error);
        }
    }

    private _validateGoogleUser(
        googleUser: IGoogleUserResult | undefined,
        response: express.Response,
    ) {
        if (!googleUser) {
            response.status(404).send("Google User was not found");
            return;
        }
        if (!googleUser.verified_email) {
            response.status(403).send("Google account is not verified");
            return;
        }
    }

    private _handleAuthError(response: express.Response, error: any) {
        return response
            .status(500)
            .send(`Error while processing Google OAuth: ${error}`);
    }

    @httpPost("")
    public async() { }
}