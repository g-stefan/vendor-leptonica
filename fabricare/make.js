// Created by Grigore Stefan <g_stefan@yahoo.com>
// Public domain (Unlicense) <http://unlicense.org>
// SPDX-FileCopyrightText: 2022-2024 Grigore Stefan <g_stefan@yahoo.com>
// SPDX-License-Identifier: Unlicense

Fabricare.include("vendor");

messageAction("make");

if (Shell.fileExists("temp/build.done.flag")) {
	return;
};

if (!Shell.directoryExists("source")) {
	exitIf(Shell.system("7z x -aoa archive/" + Project.vendor + ".7z"));
	Shell.rename(Project.vendor, "source");
};

Shell.mkdirRecursivelyIfNotExists("output");
Shell.mkdirRecursivelyIfNotExists("output/bin");
Shell.mkdirRecursivelyIfNotExists("output/include");
Shell.mkdirRecursivelyIfNotExists("output/lib");
Shell.mkdirRecursivelyIfNotExists("temp");

Shell.mkdirRecursivelyIfNotExists("temp/cmake");

if (!Shell.fileExists("temp/build.config.flag")) {
	Shell.setenv("CC", "cl.exe");
	Shell.setenv("CXX", "cl.exe");

	cmdConfig = "cmake";
	cmdConfig += " ../../source";
	cmdConfig += " -G \"Ninja\"";
	cmdConfig += " -DCMAKE_BUILD_TYPE=Release";
	cmdConfig += " -DCMAKE_INSTALL_PREFIX=" + Shell.realPath(Shell.getcwd()) + "\\output";
	cmdConfig += " -DBUILD_PROG=0";

	if (Fabricare.isDynamic()) {
		cmdConfig += " -DBUILD_SHARED_LIBS=ON";
		cmdConfig += " -DSW_BUILD_SHARED_LIBS=1";
		cmdConfig += " -DCPPAN_BUILD_SHARED_LIBS=1";
		cmdConfig += " -DWIN32_MT_BUILD=OFF";
		cmdConfig += " -DCMAKE_MSVC_RUNTIME_LIBRARY=MultiThreaded";
	};

	if (Fabricare.isStatic()) {
		cmdConfig += " -DBUILD_SHARED_LIBS=OFF";
		cmdConfig += " -DSW_BUILD_SHARED_LIBS=0";
		cmdConfig += " -DCPPAN_BUILD_SHARED_LIBS=0";
		cmdConfig += " -DWIN32_MT_BUILD=ON";
		cmdConfig += " -DCMAKE_MSVC_RUNTIME_LIBRARY=MultiThreaded";
	};

	runInPath("temp/cmake", function () {
		exitIf(Shell.system(cmdConfig));
	});

	runInPath("temp/cmake", function () {
		if (Fabricare.isStatic()) {
			Shell.filePutContents("build.ninja", Shell.fileGetContents("build.ninja").replace("/DWIN32 /D_WINDOWS /W3 /MP /MD", "/DWIN32 /D_WINDOWS /W3 /MP /MT"));
		};
	});

	Shell.filePutContents("temp/build.config.flag", "done");
};

runInPath("temp/cmake", function () {
	exitIf(Shell.system("ninja"));
	exitIf(Shell.system("ninja install"));
	exitIf(Shell.system("ninja clean"));
});

Shell.copyFile("output/lib/leptonica-1.84.1.lib","output/lib/leptonica.lib");

Shell.filePutContents("temp/build.done.flag", "done");
