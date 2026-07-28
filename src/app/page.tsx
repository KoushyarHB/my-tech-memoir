export default function Home() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-10 sm:py-14">
      <article className="prose-memoir">

        <h1>Networking 101</h1>

        <p>
          Welcome back to our networking masterclass. Today, we are going to synthesize everything we have uncovered about how the internet actually routes data to your devices.
        </p>

        <p>
          Let&apos;s review the core concepts using the exact breakdowns we&apos;ve walked through, step by step.
        </p>

        <h2>1. The Math: Why 4 Bytes?</h2>

        <p>
          You nailed it on day one. Yes, an IPv4 address is exactly 4 bytes (which equals 32 bits, since 1 byte = 8 bits).
        </p>

        <p>
          Computers do not see numbers like 192 or 168. They only see binary—ones and zeros. Each of the 4 numbers in an IP address represents exactly 1 byte of binary data. Let&apos;s look at what 192.168.1.1 actually looks like to a computer router:
        </p>

        <pre>{`  192   .   168   .    1    .    1      <- Human Readable
11000000.10101000.00000001.00000001     <- Computer Readable (Binary)
 \\____/    \\____/    \\____/    \\____/
 1 Byte    1 Byte    1 Byte    1 Byte   (= 4 Bytes Total)`}</pre>

        <p>
          Because 1 byte is made of 8 binary switches, the maximum number you can create by turning all 8 switches &ldquo;on&rdquo; (11111111) is 255 in regular numbers. That is why no single number in an IP address can ever be greater than 255.
        </p>

        <p>
          When Vint Cerf and the early internet engineers were writing the specifications for IPv4 in 1981, they had to balance hardware limitations and routing speed. Making the IP address exactly 32 bits meant a CPU could read and process an entire network address in a single hardware cycle.
        </p>

        <h2>2. What Things Have an IP? (And the Missing Versions)</h2>

        <p>
          An IP address does not just represent a server. A server is just a computer that sits in a data center waiting to answer requests. But any device that wants to talk to other devices using the Internet Protocol (IP) must have an IP address. We call these &ldquo;hosts&rdquo; or &ldquo;endpoints.&rdquo;
        </p>

        <p>
          If a device connects directly to a network (via a Wi-Fi antenna or an Ethernet cable) to send or receive data over the internet, it has an IP address—including your laptop, phone, or smart lightbulbs.
        </p>

        <p>
          Does your Bluetooth headset have an IP? No, it does not. Bluetooth headsets use a completely different short-range wireless standard. They connect directly to your phone using unique hardware addresses called MAC addresses. Your phone acts as the translator to the internet.
        </p>

        <h3>The Big Split (TCP vs. IP)</h3>

        <p>
          Originally, the protocols that handled cutting data into packets (TCP) and the protocols that handled routing those packets to an address (IP) were mashed together into one single system called TCP Version 1, 2, and 3. By 1978, the engineers realized this system was too bloated. They decided to split it into two separate layers: TCP to manage data integrity, and IP to manage addresses.
        </p>

        <h3>What happened to IPv1, 2, 3, and 5?</h3>

        <p>
          In the late 1970s, versions 1, 2, and 3 were unstable, rough-draft experiments. They finalized the split between TCP and IP on their 4th attempt, creating IPv4. IPv5 was a real, layer-5 experimental protocol built in the 1980s for live voice and video streaming, but it was scrapped because it didn&apos;t fix the address shortage. Because the number &ldquo;5&rdquo; had already been used, engineers skipped 5 and named the modern 16-byte protocol IPv6.
        </p>

        <h2>3. The Binary Logic of Classes and 192</h2>

        <p>
          To humans, 192 feels completely random. But to a computer chip inside a router, 192 is one of the most beautiful, clean, and mathematically perfect numbers possible.
        </p>

        <ul>
          <li>192 in binary: 11000000</li>
        </ul>

        <p>
          It is literally just the first two switches turned ON (11) and the remaining six switches turned completely OFF (000000). The engineers divided the 4.3 billion IPv4 addresses into 5 distinct buckets called Classes (A, B, C, D, and E) so routers could sort traffic instantly by reading these leading bits from left to right:
        </p>

        <ul>
          <li>
            <strong>Class A (Prefix 0):</strong> Range 0.0.0.0 to 127.255.255.255. Handed out to massive entities like tech giants and governments.
          </li>
          <li>
            <strong>Class B (Prefix 10):</strong> Range 128.0.0.0 to 191.255.255.255. Reserved for large corporations and universities.
          </li>
          <li>
            <strong>Class C (Prefix 110):</strong> Range 192.0.0.0 to 223.255.255.255. The lowest number you can create starting with 110 is 11000000 (192). This is meant for small businesses and home routers.
          </li>
        </ul>

        <h2>4. The Loopback Address (127.0.0.1)</h2>

        <p>
          Before looking at the router itself, we must address another vital local tool. When you type 127.0.0.1 (localhost), you are using a special hard-coded Loopback Address. It is the networking equivalent of the word &ldquo;me&rdquo; or &ldquo;myself.&rdquo;
        </p>

        <p>
          Your computer routes the data packets straight back into its own memory without ever letting them touch your network card, Wi-Fi antenna, or the outside network.
        </p>

        <h3>Why 127.0.0.1 is a Class A Address</h3>

        <p>
          Giving away an entire Class A block (2^24 or 16.7 million addresses) to a device just so it can talk to itself sounds like absolute madness. A single Class C block, or even just one single IP address, would have made way more sense. It comes down to two things: lazy engineering and unlimited space in 1981.
        </p>

        <p>
          <strong>The Power-of-Two Shortcut in Hardware:</strong> In the late 1970s and early 1980s, computer chips inside routers were incredibly weak. Because routers only looked at the first byte to make fast routing decisions, dedicating the entire 127.X.X.X Class A block to loopback allowed hardware engineers to write a tiny piece of hardcoded logic on the network chip: &ldquo;If the first byte is 127, instantly route it backward internally.&rdquo; Wasting an entire Class A block kept the hardware simple and fast.
        </p>

        <p>
          <strong>They Thought They Had Unlimited Space:</strong> When IPv4 was finalized in 1981, 4.3 billion addresses felt like an infinite ocean of numbers. The engineers honestly believed nobody would ever run out of IP addresses, so holding back one Class A block for loopback testing didn&apos;t seem like a big deal.
        </p>

        <h3>Why a &ldquo;Class C Private Address&rdquo; Wouldn&apos;t Work</h3>

        <p>There is a hidden architectural reason why they couldn&apos;t mix the two:</p>

        <ul>
          <li>
            <strong>Private Addresses (192.168.X.X)</strong> are meant to be routed. They travel through your local airwaves, hit your router, and allow your phone to talk to your laptop or your smart TV.
          </li>
          <li>
            <strong>The Loopback Address (127.0.0.1)</strong> is strictly forbidden from ever leaving the machine it was born in. It is mathematically impossible for loopback traffic to touch a router or a Wi-Fi card.
          </li>
        </ul>

        <p>
          If they had made loopback a part of the 192.168 space, routers would get incredibly confused trying to differentiate between a packet meant for a real local device and a packet meant to stay entirely inside your own computer.
        </p>

        <blockquote>
          <p>Note: They learned their lesson in IPv6. The wasteful Class A loopback block was thrown away and compressed down to one single address: ::1.</p>
        </blockquote>

        <h2>5. Clearing the Air: Public vs. Private Classes</h2>

        <p>
          Let&apos;s iron out this last crease, because the word &ldquo;Class&rdquo; is actually doing two different jobs here, which is causing the confusion.
        </p>

        <p>
          No, your router does not have a &ldquo;Class C Public IP&rdquo; facing the internet. But it creates a &ldquo;Class C Private Network&rdquo; inside your house. Here is the exact definition of Class C, and why it&apos;s split into two completely different personalities: Public and Private.
        </p>

        <h3>The Strict Definition of Class C</h3>

        <p>
          Historically, an IP address is considered Class C if its very first byte (the first 8 bits) falls anywhere between the numbers 192 and 223. That is the entire rule. If the first number is 192 through 223, it is a Class C address.
        </p>

        <p>When the internet was created, the engineers took this massive block of Class C numbers and split it into two categories:</p>

        <ul>
          <li>
            <strong>Category A: Class C Public IPs (The Internet):</strong> The vast majority of the Class C range (like 192.0.0.0 all the way up to 223.255.255.255) was handed out to real companies, early ISPs, and websites out on the public internet.
          </li>
          <li>
            <strong>Category B: Class C Private IPs (Your Living Room):</strong> The engineers took one tiny, specific slice out of that massive Class C mountain—specifically the block starting with 192.168.X.X—and said: &ldquo;Nobody on earth is allowed to own this on the public internet. We are locking it away so routers can use it for local home networks.&rdquo;
          </li>
        </ul>

        <p>
          This 192.168.0.0 block leaves the remaining two octets wide open (32 - 16 = 16 bits left over), pointing to 2^16 = 65,536 endpoints, every single one of which is universally agreed upon by every router on Earth to be completely off the public internet and strictly local. Out of the box, almost every home router locks down the third number too using a Subnet Mask (255.255.255.0), meaning it only uses 192.168.1.X (8 bits, or 256 addresses) for your actual living room.
        </p>

        <h3>Why Your Router Has &ldquo;Two Faces&rdquo;</h3>

        <p>When you buy a router, it sits on the border. It has to have two completely different IP addresses to do its job:</p>

        <ol>
          <li>
            <strong>Face 1: The Public Face (WAN):</strong> This face plugs into the wall to talk to the internet. Your ISP gives it a Public IP. As you saw with your own connection, your public IP was 104.28.239.219. Because 104 is less than 128, your router&apos;s public face is actually using a Class A Public address. ISPs use Class A because they need massive pools of numbers for millions of customers.
          </li>
          <li>
            <strong>Face 2: The Private Face (LAN):</strong> This face talks to your phone and laptop over Wi-Fi. Your router assigns itself the default local identity of 192.168.1.1. Because 192 falls into that special reserved range, your router is acting as the king of its own tiny, isolated Class C Private Network.
          </li>
        </ol>

      </article>

      <section className="mt-16 border-t border-neutral-200 dark:border-neutral-700 pt-10">
        <h2 className="text-2xl font-serif font-bold mb-6">Recent Posts</h2>

        <div className="space-y-6">
          <article className="group">
            <a href="/posts/understanding-reacts-state-tree-and-closures" className="block no-underline">
              <time className="text-sm text-neutral-500 dark:text-neutral-400">
                July 28, 2026
              </time>
              <h3 className="text-lg font-serif font-semibold mt-1 group-hover:underline">
                Understanding React&apos;s State Tree and Closures
              </h3>
              <p className="text-neutral-600 dark:text-neutral-300 mt-1">
                A deep dive into how React tracks state internally and why closures matter for understanding hooks behavior.
              </p>
            </a>
          </article>

          <article className="group">
            <a href="/posts/why-you-cant-call-usestate-inside-useeffect" className="block no-underline">
              <time className="text-sm text-neutral-500 dark:text-neutral-400">
                July 25, 2026
              </time>
              <h3 className="text-lg font-serif font-semibold mt-1 group-hover:underline">
                Why You Can&apos;t Call useState Inside useEffect
              </h3>
              <p className="text-neutral-600 dark:text-neutral-300 mt-1">
                React&apos;s Rules of Hooks exist for a reason. Here&apos;s what happens when you break them — and how to fix it.
              </p>
            </a>
          </article>
        </div>

        <a href="/posts" className="inline-block mt-6 text-sm font-medium hover:underline">
          View all posts →
        </a>
      </section>
    </div>
  );
}
