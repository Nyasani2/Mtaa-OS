import { ReputationService } from "./reputation.service";

export const EconomyService = {
  async rewardContribution(user_id: string, action: string) {
    let points = 0;

    switch (action) {
      case "post":
        points = 5;
        break;
      case "museum_entry":
        points = 10;
        break;
      case "comment":
        points = 2;
        break;
    }

    await ReputationService.adjustScore(user_id, points);

    return { awarded: points };
  }
};
