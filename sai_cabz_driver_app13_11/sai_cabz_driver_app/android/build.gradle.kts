// ✅ Root-level (Project-level) build.gradle.kts

plugins {
    // ✅ Let Flutter handle Android & Kotlin versions
    id("com.android.application") apply false
    id("com.android.library") apply false
    id("org.jetbrains.kotlin.android") apply false

    // ✅ Google Services plugin (no version)
    id("com.google.gms.google-services") apply false
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

// ✅ Build Directory Setup (optional optimization)
val newBuildDir = rootProject.layout.buildDirectory.dir("../../build").get()
rootProject.layout.buildDirectory.set(newBuildDir)

subprojects {
    val newSubprojectBuildDir = newBuildDir.dir(project.name)
    project.layout.buildDirectory.set(newSubprojectBuildDir)
    project.evaluationDependsOn(":app")
}

// ✅ Clean Task
tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
