#include "stdafx.h"

double procTimeBefore=0, procTime=0;
RECT deskRect;

void initDeskRect() {
	HWND deskWin;

	if (deskWin=GetDesktopWindow()) {
		if (!GetWindowRect(deskWin, &deskRect)) {
			ErrorExit(_T("GetWindowRect"));
		}
	} else {
		ErrorExit(_T("GetDesktopWindow"));
	}
}

bool ScanModules (DWORD processID) {
	HMODULE hMods[1024];
	HANDLE hProcess;
	DWORD cbNeeded;

	// Get a list of all the modules in this process.
	hProcess=OpenProcess(
		PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, processID
	);
	if (NULL==hProcess) return 0;

	if (EnumProcessModules(hProcess, hMods, sizeof(hMods), &cbNeeded)) {
		for (unsigned int i=0; i<cbNeeded/sizeof(HMODULE) && i<1024; i++) {
			TCHAR szModName[MAX_PATH];

			if (GetModuleBaseName(
				hProcess, hMods[i], szModName, sizeof(szModName)/sizeof(TCHAR)
			)) {
				if (0==_wcsicmp(szModName, _T("npswf32.dll"))) {
					CloseHandle(hProcess);
					return 1;
				}
			}
		}
	}

	CloseHandle(hProcess);
	return 0;
}

DWORD FindFlash() {
	DWORD aProcesses[1024], cbNeeded;

	// Get the list of process identifiers.
	if (!EnumProcesses(aProcesses, sizeof(aProcesses), &cbNeeded)) {
		return 0;
	}

	// Calculate how many process identifiers were returned.
	DWORD cProcesses=cbNeeded/sizeof(DWORD);

	for (unsigned int i=0; i<cProcesses && i<1024; i++) {
		if (ScanModules(aProcesses[i])) return aProcesses[i];
	}

	return 0;
}

double getFlashProcTime() {
	DWORD processId;
	HANDLE process;
	FILETIME createTime, exitTime, kernelTime, userTime;

	processId=FindFlash();
	if (!processId) return 0;

	process=OpenProcess(
		PROCESS_QUERY_INFORMATION,
		FALSE,
		processId
	);
	if (!process) {
		ErrorExit(_T("OpenProcess"));
	}

	if (!GetProcessTimes(
		process, 
		&createTime, &exitTime,
		&kernelTime, &userTime
	)) {
		ErrorExit(_T("GetProcessTimes"));
	}

	// ? http://www.codeproject.com/KB/threads/getprocesstimes.aspx
	return (*((__int64 *)&kernelTime)/1e7)+(*((__int64 *)&userTime)/1e7);
}

void suspendScreensaver() {
	UINT ssActive=0;
	if (SystemParametersInfo(SPI_GETSCREENSAVEACTIVE, 0, (PVOID)&ssActive, 0)) {
		SystemParametersInfo(SPI_SETSCREENSAVEACTIVE, ssActive, 0, SPIF_SENDCHANGE);
	}
}

bool rectEquals(RECT rect1, RECT rect2) {
	return rect1.top==rect2.top &&
		rect1.right==rect2.right &&
		rect1.left==rect2.left &&
		rect1.bottom==rect2.bottom;
}

void checkFlashPlaying() {
	HWND foreWin;
	RECT foreRect;

	// Skip if the time recorded is zero (not running, first sample, etc).
	procTimeBefore=procTime;
	procTime=getFlashProcTime();
	if (0==procTime || 0==procTimeBefore) {
		return;
	}

	// Skip if so little time has been used that video probably isn't playing.
	if ( (procTime-procTimeBefore) < CHECK_FREQUENCY*IDLE_RATIO ) {
		return;
	}

	// Wait again if flash (or something...) isn't full screen.
	if (foreWin=GetForegroundWindow()) {
		if (GetWindowRect(foreWin, &foreRect)) {
			if (!rectEquals(foreRect, deskRect)) return;
		} else {
			ErrorExit(_T("GetWindowRect"));
		}
	} else {
		ErrorExit(_T("GetForegroundWindow"));
	}

	// We made it through all the tests, suspend the screen saver.
	suspendScreensaver();
}
