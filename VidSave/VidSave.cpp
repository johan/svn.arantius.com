#include "stdafx.h"
#include "VidSave.h"

int _tmain(int argc, _TCHAR* argv[])
{
	BOOL status=enumProcs();

	return status;
}

BOOL enumProcs() {
	// Based very much on:
	//  http://www.alexfedotov.com/articles/enumproc.asp

	HANDLE hHeap = GetProcessHeap();
	DWORD cbReturned;
	DWORD cbAlloc = 128;
	DWORD * pdwIds = NULL;

	// Figure out "system" process ID
	OSVERSIONINFO osvi;
	osvi.dwOSVersionInfoSize = sizeof(osvi);
	GetVersionEx(&osvi);
	DWORD dwSystemId = 8;
	if (osvi.dwMajorVersion >= 5) {
		dwSystemId = (osvi.dwMinorVersion == 0) ? 2 : 4;
	}

	do {
		cbAlloc *= 2;

		if (pdwIds != NULL) {
			HeapFree(hHeap, 0, pdwIds);
		}

		// allocate memory for the array of identifiers
		pdwIds = (DWORD *)HeapAlloc(hHeap, 0, cbAlloc);
		if (pdwIds == NULL) {
			return 1;
		}

		// get processes identifiers
		if (!EnumProcesses(pdwIds, cbAlloc, &cbReturned)) {
			HeapFree(hHeap, 0, pdwIds);
			return 1;
		}
	} while (cbReturned == cbAlloc);

	for (DWORD i = 0; i < cbReturned/sizeof(DWORD); i++) {
		//BOOL bContinue;
		DWORD dwProcessId = pdwIds[i];

		if (0==dwProcessId || dwSystemId==dwProcessId) {
			continue;
		}

		HANDLE hProcess;
		HMODULE hExeModule;
		DWORD cbNeeded;
		TCHAR szModulePath[MAX_PATH];
		LPTSTR pszProcessName = NULL;

		// open process handle
		hProcess = OpenProcess(
			PROCESS_QUERY_INFORMATION|PROCESS_VM_READ,
			FALSE, dwProcessId
		);
		if (hProcess != NULL) {
			if (EnumProcessModules(
					hProcess, &hExeModule, sizeof(HMODULE), &cbNeeded
				)
			) {
				if (GetModuleFileNameExW(
						hProcess, hExeModule, szModulePath, MAX_PATH
					)
				) {
					pszProcessName = _tcsrchr(szModulePath, _T('\\'));
					if (pszProcessName == NULL) {
						pszProcessName = szModulePath;
					} else {
						pszProcessName++;
					}
				}
			}
		}

		if (0==wcscmp(_T("firefox.exe"), pszProcessName)) {
			//enumMods(hProcess);
			//printf("%d\n", cbNeeded/sizeof(HMODULE));
		}

		CloseHandle(hProcess);
	}
	return 0;
}

BOOL enumMods(HANDLE hProcess) {

	return 0;
}
