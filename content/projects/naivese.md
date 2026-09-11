# HITSZ通知新闻搜索引擎：Naive SE

[Codes](https://gitee.com/LoanCold/naivese)

[项目文档](file/SE_report.pdf)

[Slides](file/se_slides.pptx)

## Introduction

This full name of this project is called “Naïve Search Engine” which focuses on search related information by queries given by users. Users are provided with a simple website and when they enter the queries they want to search, and the website returns 10 most relevant websites that satisfy the queries. The websites are limited in HITSZ and contents are all in Chinese.

The whole project uses library including Lucene, Requests, BeautifulSoup, Tomcat, IKAnalyzer, and Servlet. At first, we use Request (Python) to build crawlers and then split the useful contents to be stored. After that, we use Lucene (JAVA) to perform indexing and querying. To support Chinese indexing and querying, we use IKAnalyzer (JAVA) to help split Chinese words. Then, to achieve website searching user interface, we use Tomcat and Servlet (JAVA) to create a virtual Internet server which enables user to access websites in Browser.

This catalogue of this project is discussed in the end of this report. Moreover, I want to declare that the final website only shows little part of the whole project. I actually do a lot more in my codes, but I didn’t enables them in the website that users finally face. The reason is that we don’t want to focus too much on the UI, and function is all that matters to me.

## Demo

![](images/se_query.png)

![](images/se_result.png)
