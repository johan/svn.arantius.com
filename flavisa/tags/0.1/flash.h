#define CHECK_FREQUENCY 2 // seconds
#define IDLE_RATIO 0.25

void initDeskRect();
bool ScanModules (DWORD processID);
DWORD FindFlash();
double getFlashProcTime();
void suspendScreensaver();
bool rectEquals(RECT rect1, RECT rect2);
void checkFlashPlaying();
