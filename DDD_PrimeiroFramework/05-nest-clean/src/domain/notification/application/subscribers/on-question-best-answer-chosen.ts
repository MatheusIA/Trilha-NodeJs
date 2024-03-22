import { DomainEvents } from "@/core/events/domain-events";
import { EventHandler } from "@/core/events/event-handler";
import { SendNotificationUseCase } from "../use-cases/send-notification";
import { AnswersRepository } from "@/domain/forum/application/repositories/answers-repository";
import { QuestionBestAnswerChosenEvent } from "@/domain/forum/enterprise/entities/events/question-best-answer.chosen-event";
import { Injectable } from "@nestjs/common";

@Injectable()
export class OnQuestionBestAnswerChosen implements EventHandler {
  constructor(
    private answersRepository: AnswersRepository,
    private sendNotification: SendNotificationUseCase,
  ) {
    this.setupSubscriptions();
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.sendQuestionBestAnswerNotification.bind(this),
      QuestionBestAnswerChosenEvent.name,
    );
  }

  private async sendQuestionBestAnswerNotification({
    question,
    bestAnsweredId,
  }: QuestionBestAnswerChosenEvent) {
    const answer = await this.answersRepository.findById(
      bestAnsweredId.toString(),
    );

    if (answer) {
      await this.sendNotification.execute({
        recipientId: question.authorId.toString(),
        title: `Sua resposta foi escolhida !`,
        content: `A resposta que você enviou em "${question.title.substring(0, 20).concat("...")}" foi escolhida pelo autor`,
      });
    }
  }
}
