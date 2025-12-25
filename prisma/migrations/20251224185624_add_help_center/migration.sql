-- CreateTable
CREATE TABLE "HelpCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HelpCategoryTranslation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "helpCategoryId" INTEGER NOT NULL,
    "lang" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "HelpCategoryTranslation_helpCategoryId_fkey" FOREIGN KEY ("helpCategoryId") REFERENCES "HelpCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HelpArticle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "helpCategoryId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HelpArticle_helpCategoryId_fkey" FOREIGN KEY ("helpCategoryId") REFERENCES "HelpCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HelpArticleTranslation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "helpArticleId" INTEGER NOT NULL,
    "lang" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    CONSTRAINT "HelpArticleTranslation_helpArticleId_fkey" FOREIGN KEY ("helpArticleId") REFERENCES "HelpArticle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "HelpCategory_slug_key" ON "HelpCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "HelpCategoryTranslation_helpCategoryId_lang_key" ON "HelpCategoryTranslation"("helpCategoryId", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "HelpArticleTranslation_helpArticleId_lang_key" ON "HelpArticleTranslation"("helpArticleId", "lang");
