import {NextFunction, Request, Response} from "express";
import {v4 as uuidv4} from "uuid";
import {controller, httpPost} from "inversify-express-utils";
import {inject} from "inversify";
import {ResetPasswordService} from "../../services/user_details/reset.password.service";

@controller("/reset-password")
export class ResetPasswordController {
    private passwordResetService: ResetPasswordService;

    constructor(
        @inject(ResetPasswordService) passwordResetService: ResetPasswordService,
    ) {
        this.passwordResetService = passwordResetService;
    }

    @httpPost("/initiate")
    async initiatePasswordReset(
        request: Request,
        response: Response,
        next: NextFunction,
    ) {
        const { email } = request.body;
        try {
            const token: string = uuidv4();
            await this.passwordResetService.requestPasswordReset(email, token);
            response
                .status(200)
                .json({message: "Password reset link was sent to your contact."});
        } catch (error) {
            next(error);
        }
    }

    async resetPasswordWithToken(
        request: Request,
        response: Response,
        next: NextFunction,
    ) {
        const { token: token } = request.params;
        const { newPassword } = request.body;
        try {
            await this.passwordResetService.changePasswordWithToken(
                token,
                newPassword,
            );
            response
                .status(200)
                .json({ message: "Password was reset successfully." });
        } catch (error) {
            next(error);
        }
    }

    async resetPasswordWithEmail(
        request: Request,
        response: Response,
        next: NextFunction,
    ) {
        const { email, oldPassword, newPassword } = request.body;
        try {
            await this.passwordResetService.changePasswordWithEmail(
                email,
                oldPassword,
                newPassword,
            );
            response
                .status(200)
                .json({ message: "Password was reset successfully." });
        } catch (error) {
            next(error);
        }
    }
}