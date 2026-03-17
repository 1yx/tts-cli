# 16 Startup Metrics

> Jeff Jordan, Anu Hariharan, Frank Chen, and Preethi Kasireddy Posted
> August 21, 2015

We have the privilege of meeting with thousands of entrepreneurs every year, and in the course of those discussions are presented with all kinds of numbers, measures, and metrics that illustrate the promise and health of a particular company. Sometimes, however, the metrics may not be the best gauge of what’s actually happening in the business, or people may use different definitions of the same metric in a way that makes it hard to understand the health of the business.

So, while some of this may be obvious to many of you who live and breathe these metrics all day long, we compiled a list of the most common or confusing ones. Where appropriate, we tried to add some notes on why investors focus on those metrics. Ultimately, though, good metrics _aren’t_ about [raising money](https://a16z.com/16-common-questions-about-fundraising/) from VCs—they’re about running the business in a way where founders know how and why certain things are working (or not) … and can address or adjust accordingly.

## Business and financial metrics

### 1\. Bookings vs. revenue

A common mistake is to use bookings and revenue interchangeably, but they aren’t the same thing.

**Bookings** is the value of a contract between the company and the customer. It reflects a contractual obligation on the part of the customer to pay the company.

**Revenue** is recognized when the service is actually provided or ratably over the life of the subscription agreement. How and when revenue is recognized is governed by GAAP.

Letters of intent and verbal agreements are neither revenue nor bookings.

### 2\. Recurring revenue vs. Total revenue

Investors more highly value companies where the majority of total revenue comes from product revenue (vs. from services). Why? Services revenue is non-recurring, has much lower margins, and is less scalable. Product revenue is the what you generate from the sale of the software or product itself.

**ARR (annual recurring revenue)** is a measure of revenue components that are recurring in nature. It should exclude one-time (non-recurring) fees and professional service fees.

**ARR per customer:** Is this flat or growing? If you are upselling or cross-selling your customers, then it should be growing, which is a positive indicator for a healthy business.

**MRR (monthly recurring revenue):** Often, people will multiply one month’s all-in bookings by 12 to get to ARR. Common mistakes with this method include: (1) counting non-recurring fees such as hardware, setup, installation, professional services/ consulting agreements; (2) counting bookings (see #1).

### 3\. Gross profit

While top-line bookings growth is super important, investors want to understand _how profitable_ that revenue stream is. Gross profit provides that measure.

What’s included in gross profit may vary by company, but in general all costs associated with the manufacturing, delivery, and support of a product/service should be included.

So be prepared to break down what’s included in—and excluded—from that gross profit figure.

### 4\. Total contract value (TCV) vs. annual contract value (ACV)

**TCV (total contract value)** is the total value of the contract, and can be shorter or longer in duration. Make sure TCV also includes the value from one-time charges, professional service fees, and recurring charges.

**ACV (annual contract value)**, on the other hand, measures the value of the contract over a 12-month period. Questions to ask about ACV:

_What is the size?_ Are you getting a few hundred dollars per month from your customers, or are you able to close large deals? Of course, this depends on the market you are targeting (SMB vs. mid-market vs. enterprise).

_Is it growing_ (and especially not shrinking)? If it’s growing, it means customers are paying you more on average for your product over time. That implies either your product is fundamentally doing more (adding features and capabilities) to warrant that increase, or is delivering so much value customers (improved functionality over alternatives) that they are willing to pay more for it.

See also [this post](http://www.quora.com/What-was-the-average-ACV-Annual-Contract-Value-for-the-fastest-growing-enterprise-software-SaaS-companies-in-their-first-year-or-two-of-operations) on ACV.

### 5\. LTV (lifetime value)

Lifetime value is the present value of the future _net profit_ from the customer over the duration of the relationship. It helps determine the long-term value of the customer and how much net value you generate per customer after accounting for customer acquisition costs (CAC).

A common mistake is to estimate the LTV as a _present value of revenue_ or even _gross margin of the customer_ instead of calculating it as _net profit of the customer_ over the life of the relationship.

**Reminder, here’s a way to calculate LTV:**

- **Revenue per customer (per month)** = average order value multiplied by the number of orders.
- **Contribution margin per customer (per month)** = revenue from customer minus variable costs associated with a customer. Variable costs include selling, administrative and any operational costs associated with serving the customer.
- **Avg. life span of customer (in months)** = 1 / by your monthly churn. **LTV** = Contribution margin from customer multiplied by the average lifespan of customer.

Note,if you have only few months of data, the conservative way to measure LTV is to look at historical value to date. Rather than predicting average life span and estimating how the retention curves might look, we prefer to measure 12 month and 24 month LTV.

Another important calculation here is **LTV as it contributes to margin**. This is important because a revenue or gross margin LTV suggests a higher upper limit on what you can spend on customer acquisition. **Contribution Margin LTV to CAC ratio** is also a good measure to determine CAC payback and manage your advertising and marketing spend accordingly.

See also Bill Gurley on the “ [dangerous seductions](http://abovethecrowd.com/2012/09/04/the-dangerous-seduction-of-the-lifetime-value-ltv-formula/)” of the lifetime value formula.

### 6\. Gross merchandise value (GMV) vs. revenue

In marketplace businesses, these are frequently used interchangeably. But GMV does not equal revenue!

**GMV (gross merchandise volume)** is the total sales dollar volume of merchandise transacting through the marketplace in a specific period. It’s the real top line, what the consumer side of the marketplace is spending. It is a useful measure of the size of the marketplace and can be useful as a “current run rate” measure based on annualizing the most recent month or quarter.

**Revenue** is the portion of GMV that the marketplace “takes”. Revenue consists of the various fees that the marketplace gets for providing its services; most typically these are transaction fees based on GMV successfully transacted on the marketplace, but can also include ad revenue, sponsorships, etc. These fees are usually a fraction of GMV.

### 7\. Unearned or deferred revenue—and billings

In a SaaS business,this is the cash you collect at the time of the booking in advance of when the revenues will actually be realized.

As we’ve [shared previously](https://a16z.com/understanding-saas-why-the-pundits-have-it-wrong/), SaaS companies only get to recognize revenue over the term of the deal as the service is delivered— _even if a customer signs a huge up-front deal_. So in most cases, that “booking” goes onto the balance sheet in a liability line item called deferred revenue. (Because the balance sheet has to “balance,” the corresponding entry on the assets side of the balance sheet is “cash” if the customer pre-paid for the service or “accounts receivable” if the company expects to bill for and receive it in the future). As the company starts to recognize revenue from the software as service, it reduces its deferred revenue balance and increases revenue: for a 24-month deal, as each month goes by deferred revenue drops by 1/24th and revenue increases by 1/24th.

A good proxy to measure the growth—and ultimately the health—of a SaaS company is to look at **billings**, which is calculated by taking the revenue in one quarter and adding the change in deferred revenue from the prior quarter to the current quarter. If a SaaS company is growing its bookings (whether through new business or upsells/renewals to existing customers), billings will increase.

Billings is a much better forward-looking indicator of the health of a SaaS company than simply looking at revenue because revenue understates the true value of the customer, which gets recognized ratably. But it’s also tricky because of the very nature of recurring revenue itself: A SaaS company could show stable revenue for a long time—just by working off its billings backlog—which would make the business _seem_ healthier than it truly is. This is something we therefore watch out for when evaluating the unit economics of such businesses.

### 8\. CAC (customer acquisition cost)—blended vs. paid, organic vs. inorganic

Customer acquisition cost or CACshould be the _full_ cost of acquiring users, stated on a per user basis. Unfortunately, CAC metrics come in all shapes and sizes.

One common problem with CAC metrics is failing to include all the costs incurred in user acquisition such as referral fees, credits, or discounts. Another common problem is to calculate CAC as a “blended” cost (including users acquired organically) rather than isolating users acquired through “paid” marketing. While **blended CAC** \[total acquisition cost / total new customers acquired across all channels\] isn’t wrong, it doesn’t inform how well your paid campaigns are working and whether they’re profitable.

This is why investors consider **paid CAC** \[total acquisition cost/ new customers acquired through paid marketing\] to be more important than blended CAC in evaluating the viability of a business—it informs whether a company can scale up its user acquisition budget profitably. While an argument can be made in some cases that paid acquisition contributes to organic acquisition, one would need to demonstrate proof of that effect to put weight on blended CAC.

Many investors do like seeing both, however: the blended number as well as the CAC, broken out by paid/unpaid. We also like seeing the breakdown by dollars of paid customer acquisition channels: for example, how much does a paying customer cost if they were acquired via Facebook?

Counterintuitively, it turns out that costs typically go _up_ as you try and reach a larger audience. So it might cost you $1 to acquire your first 1,000 users, $2 to acquire your next 10,000, and $5 to $10 to acquire your next 100,000. That’s why you can’t afford to ignore the metrics about volume of users acquired via each channel.

## Product and engagement metrics

### 9\. Active users

Different companies have almost unlimited definitions for what “active” means. Some charts don’t even define what that activity is, while others include inadvertent activity—such as having a high proportion of first-time users or accidental one-time users.

Be clear on how you define “active.”

### **10\. Month-on-month (MoM) growth**

Often this measured as the simple average of monthly growth rates. But investors often prefer to measure it as **CMGR (Compounded Monthly Growth Rate)** since CMGR measures the periodic growth, especially for a marketplace.

Using CMGR \[CMGR = (Latest Month/ First Month)^(1/# of Months) -1\] also helps you benchmark growth rates with other companies. This would otherwise be difficult to compare due to volatility and other factors. The CMGR will be smaller than the simple average in a growing business.

### 11\. Churn

There’s all kinds of churn—dollar churn, customer churn, net dollar churn—and there are varying definitions for how churn is measured. For example, some companies measure it on a revenue basis annually, which blends upsells with churn.

**Investors look at it the following way:**

- **Monthly unit churn** = lost customers/prior month total
- **Retention by cohort**
  - **Month 1** = 100% of installed base
  - **Latest Month** = % of original installed base that are still transacting

#### It is also important to differentiate between gross churn and net revenue churn:

- **Gross churn**: MRR _lost_ in a given month/MRR at the beginning of the month.
- **Net churn**: (MRR lost _minus_ MRR from upsells) in a given month/MRR at the beginning of the month.

The difference between the two is significant. Gross churn estimates the actual loss to the business, while net revenue churn understates the losses (as it blends upsells with absolute churn).

### 12\. Burn rate

Burn rate is the rate at which cash is decreasing. Especially in early stage startups, it’s important to know and monitor burn rate as companies fail when they are running out of cash and don’t have enough time left to raise funds or reduce expenses.

**As a reminder, here’s a simple calculation:**

- **Monthly cash burn** = cash balance at the beginning of the year _minus_ cash balance end of the year / 12

**It’s also important to measure net burn vs. gross burn:**

- **Net burn** \[revenues (including all incoming cash you have a high probability of receiving) – gross burn\] is the true measure of amount of cash your company is burning every month.
- **Gross burn** on the other hand only looks at your monthly expenses + any other cash outlays.

Investors tend to focus on net burn to understand how long the money you have left in the bank will last for you to run the company. They will also take into account the rate at which your revenues and expenses grow as monthly burn may not be a constant number.

See also Fred Wilson on [burn rate](http://avc.com/2011/12/burn-rate/).

### 13\. Downloads

Downloads (or number of apps delivered by distribution deals) are really just a vanity metric.

Investors want to see _engagement_, ideally expressed as cohort retention on metrics that matter for that business—for example, DAU (daily active users), MAU (monthly active users), photos shared, photos viewed, and so on.

## **Presenting metrics generally**

### **14.** **Cumulative charts (vs. growth metrics)**

Cumulative charts by definition always go up and to the right for any business that is showing any kind of activity. But they are not a valid measure of growth—they can go up-and-to-the-right _even when_ a business is shrinking. Thus, the metric is not a useful indicator of a company’s health.

Investors like to look at monthly GMV, monthly revenue, or new users/customers per month to assess the growth in early stage businesses. Quarterly charts can be used for later-stage businesses or businesses with a lot of month-to-month volatility in metrics.

### 15\. Chart tricks

There a number of [such tricks](http://nautil.us/issue/19/illusions/five-ways-to-lie-with-charts), but a few common ones include not labeling the Y-axis; shrinking scale to exaggerate growth; and only presenting percentage gains without presenting the absolute numbers. (This last one is misleading since percentages can sound impressive off a small base, but are not an indicator of the future trajectory.)

### 16\. Order of operations

It’s fine to present metrics in any order as you tell your story.

When initially evaluating businesses, investors often look at GMV, revenue, and bookings first because they’re an indicator of the size of the business. Once investors have a sense of the the size of the business, they’ll want to understand growth to see how well the company is performing. These basic metrics, if interesting, then compel us to look even further.

As one of our partners who recently had a baby observes here: It’s almost like doing a health check for your baby at the pediatrician’s office. Check weight and height, and then compare to previous estimates to make sure things look healthy before you go any deeper!
