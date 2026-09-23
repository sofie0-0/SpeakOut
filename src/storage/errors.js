// 저장소 함수가 던지는 오류. 화면은 message가 아니라 code로 분기한다.
export const StorageErrorCode = {
  EMPTY_FOLDER_NAME: 'EMPTY_FOLDER_NAME',
  DUPLICATE_FOLDER_NAME: 'DUPLICATE_FOLDER_NAME',
  FOLDER_NOT_FOUND: 'FOLDER_NOT_FOUND',
  SENTENCE_NOT_FOUND: 'SENTENCE_NOT_FOUND',
  EMPTY_SENTENCE: 'EMPTY_SENTENCE',
  INVALID_PROFICIENCY: 'INVALID_PROFICIENCY',
}

export class StorageError extends Error {
  constructor(code, message) {
    super(message ?? code)
    this.name = 'StorageError'
    this.code = code
  }
}
