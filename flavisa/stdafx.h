#pragma once
#define WIN32_LEAN_AND_MEAN

#include <tchar.h>
#include <windows.h>

#include <commctrl.h>
#include <psapi.h>
#include <shellapi.h>
#include <strsafe.h> // For ErrorExit() .

// For the Process class and its details.
#using <System.dll>
using namespace System;
using namespace System::ComponentModel;
using namespace System::Diagnostics;
