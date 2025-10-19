import { GIT_RESPONSES } from "@/services/git/swagger/git.response";

export const CloneOkExample = {
  summary: GIT_RESPONSES.OK.message,
  value: {
    ok: true,
    data: {
      targetPath: "C:/Users/<user>/nice-repos/nice",
      dirName: "nice"
    }
  }
};

export const CloneInvalidArgumentExample = {
  summary: GIT_RESPONSES.INVALID_ARGUMENT.message,
  value: {
    ok: false,
    code: GIT_RESPONSES.INVALID_ARGUMENT.code,
    message: GIT_RESPONSES.INVALID_ARGUMENT.message
  }
};

export const CloneAlreadyExistsExample = {
  summary: GIT_RESPONSES.ALREADY_EXISTS.message,
  value: {
    ok: false,
    code: GIT_RESPONSES.ALREADY_EXISTS.code,
    message: `${GIT_RESPONSES.ALREADY_EXISTS.message}: C:/Users/<user>/nice-repos/nice`
  }
};

export const CloneFailedExample = {
  summary: GIT_RESPONSES.CLONE_FAILED.message,
  value: {
    ok: false,
    code: GIT_RESPONSES.CLONE_FAILED.code,
    message: GIT_RESPONSES.CLONE_FAILED.message
  }
};
